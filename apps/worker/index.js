const { generateContent, generateEmbedding } = require('../../packages/integrations/gemini.js');
const { fetchPendingTopics, updateTopicStatus: updateSheetStatus } = require('../../packages/integrations/googleSheets.js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const env = require('../../config/env.js');
const crypto = require('crypto');

const headers = {
  'apikey': env.SUPABASE_KEY,
  'Authorization': `Bearer ${env.SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

const QDRANT_HEADERS = {
  'Content-Type': 'application/json',
  'api-key': env.QDRANT_API_KEY
};

// --- Utilities ---

const fetchWithTimeout = async (url, options = {}) => {
  const timeout = options.timeout || 8000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms: ${url}`);
    }
    throw err;
  }
};

async function withRetry(operationName, fn, maxRetries = 3) {
  let attempt = 1;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err) {
      console.log(`⚠️  ${operationName} failed on attempt ${attempt}: ${err.message}`);
      if (attempt === maxRetries) {
        throw new Error(`❌ ${operationName} totally failed after ${maxRetries} attempts.`);
      }
      await new Promise(r => setTimeout(r, 1000 * attempt));
      attempt++;
    }
  }
}

// --- Platform Actions ---

async function ensureQdrantCollection(vectorSize = 768) {
  console.log("⏳ Validating Qdrant Collection status...");
  const url = `${env.QDRANT_URL}/collections/linkedin_topics`;
  const res = await fetchWithTimeout(url, { method: 'GET', headers: QDRANT_HEADERS });
  
  if (res.status === 404) {
    console.log("⚠️ Collection not found. Initializing 'linkedin_topics'...");
    const createRes = await fetchWithTimeout(url, {
      method: 'PUT',
      headers: QDRANT_HEADERS,
      body: JSON.stringify({
        vectors: { size: vectorSize, distance: "Cosine" }
      })
    });
    if (!createRes.ok) throw new Error(`Failed to create collection: ${await createRes.text()}`);
    console.log("✅ Collection initialized successfully.\n");
  } else if (!res.ok) {
     throw new Error(`Qdrant validation error: ${res.status}`);
  } else {
     console.log("✅ Collection validation passed.\n");
  }
}

async function checkVectorDedup(topic, embedding) {
  return await withRetry('Vector Search', async () => {
    console.log("⏳ Searching Qdrant Cloud for semantic duplicates...");
    const url = `${env.QDRANT_URL}/collections/linkedin_topics/points/search`;
    
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: QDRANT_HEADERS,
      body: JSON.stringify({
        vector: embedding,
        limit: 1,
        with_payload: true,
        score_threshold: env.SIMILARITY_THRESHOLD
      })
    });

    if (!response.ok) {
      throw new Error(`Qdrant Search API Error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    if (!data.result || data.result.length === 0) {
      console.log("💡 Dedup Log: Topic is Novel (No semantic matches found or Cold Start).");
      console.log(`💡 Dedup Log: Decision -> ACCEPT\n`);
      return false;
    }

    const match = data.result[0];
    console.log(`💡 Dedup Log: Top Similarity Score: ${match.score.toFixed(3)}`);
    console.log(`💡 Dedup Log: Matches Against: "${match.payload.title}"`);
    console.log(`💡 Dedup Log: Decision -> REJECT\n`);
    return true;
  });
}

async function storeVectorDedup(id, topic, embedding) {
  await withRetry('Vector Insert', async () => {
    console.log("⏳ Saving semantic vector to Qdrant...");
    const url = `${env.QDRANT_URL}/collections/linkedin_topics/points?wait=true`;
    
    const response = await fetchWithTimeout(url, {
      method: 'PUT',
      headers: QDRANT_HEADERS,
      body: JSON.stringify({
        points: [{ id: id, vector: embedding, payload: { title: topic } }]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to sink vector embedding: ${await response.text()}`);
    }
    console.log(`✅ Qdrant Sync Complete [ID: ${id}]\n`);
  });
}

async function storeTopicInDb(id, topic) {
  console.log("⏳ Saving Topic to Supabase PostgreSQL [PENDING]...");
  const url = `${env.SUPABASE_URL}/rest/v1/topics`;
  
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify({ id, title: topic, status: 'PENDING' })
  });

  if (!response.ok) {
    throw new Error(`Supabase API POST Error: ${response.status} - ${await response.text()}`);
  }

  console.log(`✅ Stored Topic in Postgres [ID: ${id}]\n`);
}

async function updateTopicStatus(id, status, errorMessage = null) {
  console.log(`⏳ Updating Topic Status to [${status}]...`);
  const url = `${env.SUPABASE_URL}/rest/v1/topics?id=eq.${id}`;
  
  const payload = { status };
  if (errorMessage) {
    payload.error_message = errorMessage;
  }

  try {
    const response = await fetchWithTimeout(url, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`❌ Failed to update Topic status: ${await response.text()}`);
    } else {
      console.log(`✅ Status safely synced.\n`);
    }
  } catch (error) {
     console.error(`❌ Network error updating Topic status: ${error.message}`);
  }
}

// --- Next.js Dashboard Hook ---

async function storePostInDb(topicId, payload, imageUrl) {
  console.log("⏳ Offloading generated Post to Governance Dashboard [status=generated]...");
  const url = `${env.SUPABASE_URL}/rest/v1/posts`;
  
  const postBody = {
    topic_id: topicId,
    content: payload.post,
    hashtags: JSON.stringify(payload.hashtags), // Or just array depending on Supabase JSONB
    diagram: payload.diagram,
    status: 'generated',
    image_url: imageUrl || null
  };

  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(postBody)
    });

    if (!response.ok) {
      console.error(`❌ Supabase POST API Error: ${response.status} - ${await response.text()}`);
      throw new Error("Governance Insert failed");
    }
    console.log(`✅ Post stored in UI Schema securely pending Approval.\n`);
  } catch (error) {
    throw error;
  }
}

// --- Main Execution ---

async function main() {
  console.log("🚀 Worker Pipeline Started (Production Mode)\n");

  let metrics = {
    totalTopicsProcessed: 0,
    duplicatesRejected: 0,
    successfulInserts: 0
  };

  if (!env.QDRANT_URL || !env.QDRANT_API_KEY) {
     console.error("🛑 FATAL: QDRANT_URL or QDRANT_API_KEY missing. Failing fast. Skipping.");
     process.exit(1);
  }

  console.log("⏳ Connecting to Google Sheets...");
  let pendingTopics = [];
  try {
    pendingTopics = await withRetry('Google Sheets Fetch', fetchPendingTopics);
    console.log(`✅ Found ${pendingTopics.length} pending topics in schedule.\n`);
  } catch (sheetErr) {
    console.error(`❌ Fatal Sheet Fetch Error: ${sheetErr.message}`);
    process.exit(1);
  }

  let selectedTopicObj = null;

  // Process from highest priority
  for (const item of pendingTopics) {
    console.log(`========================================`);
    console.log(`📌 Evaluating Sheet Topic: "${item.topic}" (Priority: ${item.priority})`);
    console.log(`========================================\n`);
    
    metrics.totalTopicsProcessed++;
    try {
      console.log("⏳ Generating Embeddings via Gemini...");
      const embedding = await withRetry('Embedding Generation', () => generateEmbedding(item.topic));
      
      await ensureQdrantCollection(embedding.length);

      const isDuplicate = await checkVectorDedup(item.topic, embedding);
      if (isDuplicate) {
        console.error("🛑 Topic rejected by Semantic Engine.\n");
        await withRetry('Sheet Update', () => updateSheetStatus(item.rowIndex, 'rejected'));
        metrics.duplicatesRejected++;
        continue; // Keep looping to try the next one
      }

      // Valid Topic Found!
      selectedTopicObj = { ...item, embedding };
      break; 
    } catch (err) {
      console.error(`❌ Pipeline Error examining topic: ${err.message}\n`);
      continue;
    }
  }

  // Fallback: If no pending OR all were rejected
  if (!selectedTopicObj) {
    console.log(`========================================`);
    console.log(`⚠️  Pipeline Starvation: No novel topics found from Sheet.`);
    console.log(`⏳ Activating Fallback: Generating dynamic topic via Gemini...`);
    
    try {
      const fallbackPrompt = "Generate a highly professional, singular 5-9 word LinkedIn topic about advanced software architecture or Agentic AI. Return EXACTLY the text, nothing else. No quotes.";
      const rawFallback = await withRetry('Gemini Fallback Generation', () => generateContent(fallbackPrompt));
      const fallbackTopic = rawFallback.replace(/["']/g, '').trim();
      
      console.log(`✅ Fallback Topic: "${fallbackTopic}"\n`);
      
      metrics.totalTopicsProcessed++;
      const embedding = await withRetry('Embedding Generation', () => generateEmbedding(fallbackTopic));
      await ensureQdrantCollection(embedding.length);

      const isDuplicateFallback = await checkVectorDedup(fallbackTopic, embedding);
      if (isDuplicateFallback) {
         console.error("🛑 FATAL: Fallback generation also resulted in a duplicate. Terminating Worker safely.\n");
         process.exit(0);
      }
      
      selectedTopicObj = { 
        topic: fallbackTopic, 
        embedding, 
        source: 'fallback', 
        isFallback: true 
      };
    } catch (fallbackErr) {
      console.error(`❌ Fatal Fallback API Error: ${fallbackErr.message}`);
      process.exit(1);
    }
  }

  // --- Proceed with Content Generation & Storage ---
  
  console.log(`========================================`);
  console.log(`📌 Processing Selected Novel Topic: "${selectedTopicObj.topic}"`);
  console.log(`========================================\n`);
  
  let generatedId = crypto.randomUUID();

  try {
    // 4. Transactional Write
    await storeVectorDedup(generatedId, selectedTopicObj.topic, selectedTopicObj.embedding);
    await storeTopicInDb(generatedId, selectedTopicObj.topic);

    // 5. Worker Payload
    console.log("⏳ Calling Gemini for Content Generation...\n");
    const prompt = `Write a professional LinkedIn post about: ${selectedTopicObj.topic}. Include a hook, 3 short analytical points, a conclusion, and 3 hashtags. Keep it under 200 words.\nReturn the output STRICTLY as valid JSON without markdown wrapping. Use schema: { "topic": "${selectedTopicObj.topic}", "post": "body", "hashtags": ["[#A]", "[#B]"], "diagram": "graph TD\\n A-->B" }`;

    const generatedText = await generateContent(prompt);
    const cleanJson = generatedText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    const payload = JSON.parse(cleanJson);
    
    console.log("✅ Content generation successful.\n");
    console.log("📝 JSON Result:\n", JSON.stringify(payload, null, 2), "\n");
    
    // --- 5.1 Diagram Generation Pipeline ---
    let imageUrl = null;
    if (payload.diagram && (payload.diagram.trim().startsWith('graph') || payload.diagram.trim().startsWith('sequence') || payload.diagram.trim().startsWith('flowchart'))) {
      const diagramId = generatedId;
      const mmdPath = `/tmp/${diagramId}.mmd`;
      const pngFilename = `${diagramId}.png`;
      const pngOutPath = path.join(__dirname, '../dashboard/public/diagrams', pngFilename);
      
      try {
        fs.mkdirSync(path.join(__dirname, '../dashboard/public/diagrams'), { recursive: true });
        fs.writeFileSync(mmdPath, payload.diagram);
        
        console.log(`⏳ Compiling Mermaid script to PNG via Headless Chromium...`);
        execSync(`npx mmdc -i "${mmdPath}" -o "${pngOutPath}" -b transparent`, { stdio: 'ignore' });
        
        imageUrl = `/diagrams/${pngFilename}`;
        console.log(`✅ Diagram correctly compiled natively to ${imageUrl}\n`);
      } catch (err) {
        console.error(`⚠️ Diagram Rendering Exception: ${err.message}\n`);
      }
    }

    // 6. Hook into Next.js Dashboard
    await storePostInDb(generatedId, payload, imageUrl);
    
    // 7. Mark Topic STORED
    await updateTopicStatus(generatedId, 'STORED');
    
    // 8. Mark Google Sheets "used" (if it came from the sheet)
    if (!selectedTopicObj.isFallback) {
       console.log("⏳ Syncing fulfillment state back to Google Sheets...");
       await withRetry('Sheet Update', () => updateSheetStatus(selectedTopicObj.rowIndex, 'used'));
       console.log("✅ Google Sheets Synced Successfully.\n");
    }

    metrics.successfulInserts++;
    
  } catch (error) {
     console.error(`❌ Pipeline Execution Break: ${error.message}`);
     
     if (generatedId) {
       console.error(`⚠️ Attempting to override PostgreSQL Native Record [${generatedId}] to FAILED...`);
       await updateTopicStatus(generatedId, 'FAILED', error.message);
     }
     
     if (!selectedTopicObj.isFallback) {
        console.error(`⚠️ Bouncing Google Sheet origin to explicitly rejected...`);
        await withRetry('Sheet Update', () => updateSheetStatus(selectedTopicObj.rowIndex, 'rejected')).catch(() => {});
     }
     console.error("🛑 Worker caught fault safely. Marked logic state effectively.\n");
  }

  console.log(`========================================`);
  console.log(`📊 Pipeline Metrics Report`);
  console.log(`   - Topics Evaluated: ${metrics.totalTopicsProcessed}`);
  console.log(`   - Rejections (Dedup): ${metrics.duplicatesRejected}`);
  console.log(`   - Successful Completes: ${metrics.successfulInserts}`);
  console.log(`========================================\n`);
}

main();
