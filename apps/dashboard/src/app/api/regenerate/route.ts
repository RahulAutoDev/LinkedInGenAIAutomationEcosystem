import { NextResponse } from 'next/server';
import { supabaseHeaders, fetchWithTimeout } from '@/lib/supabase';

export async function POST(req: Request) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  try {
    const { postId, topicTitle } = await req.json();

    if (!postId || !topicTitle) {
      return NextResponse.json({ success: false, error: "Missing postId or topicTitle" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY in environment mapping.");
    }

    // 1. Generate new content from Gemini
    const systemPrompt = `Write a professional LinkedIn post about: ${topicTitle}. Include a hook, 3 short analytical points, a conclusion, and 3 hashtags. Keep it under 200 words.\nReturn the output STRICTLY as valid JSON without markdown wrapping. Use schema: { "topic": "${topicTitle}", "post": "body", "hashtags": ["[#A]", "[#B]"], "diagram": "graph TD\\n A-->B" }`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
    
    const geminiRes = await fetchWithTimeout(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      })
    });

    if (!geminiRes.ok) {
      throw new Error(`Gemini API Error: ${await geminiRes.text()}`);
    }

    const geminiData = await geminiRes.json();
    let generatedText = geminiData.candidates[0].content.parts[0].text;
    
    // Clean JSON formatting
    const cleanJson = generatedText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    const payload = JSON.parse(cleanJson);

    // 2. Fetch the old post to derive current version scalar
    const supabaseOldFetch = `${SUPABASE_URL}/rest/v1/posts?id=eq.${postId}&select=version,topic_id`;
    const oldFetchRes = await fetchWithTimeout(supabaseOldFetch, {
      method: 'GET',
      headers: supabaseHeaders
    });
    
    if (!oldFetchRes.ok) {
       throw new Error(`Failed to map old post version: ${await oldFetchRes.text()}`);
    }
    const oldPostData = await oldFetchRes.json();
    const currentVersion = oldPostData[0]?.version || 1;
    const coreTopicId = oldPostData[0]?.topic_id;

    // 3. Deactivate current active pointer structurally
    const supabaseDeactivateUrl = `${SUPABASE_URL}/rest/v1/posts?id=eq.${postId}`;
    await fetchWithTimeout(supabaseDeactivateUrl, {
      method: 'PATCH',
      headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify({ is_active: false })
    });

    // 3.5 Native Diagram Rendering Pipeline
    let imageUrl = null;
    let fallbackDiagramString = payload.diagram || null;
    
    if (fallbackDiagramString && (fallbackDiagramString.trim().startsWith('graph') || fallbackDiagramString.trim().startsWith('sequence') || fallbackDiagramString.trim().startsWith('flowchart'))) {
      try {
        const { execSync } = require('child_process');
        const fs = require('fs');
        const path = require('path');
        
        const mmdPath = `/tmp/${postId}.mmd`;
        const pngFilename = `regen-${postId}-${currentVersion + 1}.png`;
        // Navigate correctly into Dashboard's public folder relative to CWD
        const pngOutDir = path.join(process.cwd(), 'public', 'diagrams'); 
        const pngOutPath = path.join(pngOutDir, pngFilename);
        
        fs.mkdirSync(pngOutDir, { recursive: true });
        fs.writeFileSync(mmdPath, fallbackDiagramString);
        
        console.log(`[Regenerate API] Booting Mermaid PNG Compilation natively...`);
        execSync(`npx mmdc -i "${mmdPath}" -o "${pngOutPath}" -b transparent`, { stdio: 'ignore' });
        
        imageUrl = `/diagrams/${pngFilename}`;
        console.log(`[Regenerate API] Successfully mapped image buffer to ${imageUrl}`);
      } catch (err: any) {
        console.error("⚠️ Mermaid CLI Generation Execution Error:", err.message);
      }
    }

    // 4. Create new Version recursively
    const supabaseCreateUrl = `${SUPABASE_URL}/rest/v1/posts`;
    const insertBody = {
      topic_id: coreTopicId,
      content: payload.post,
      hashtags: JSON.stringify(payload.hashtags),
      diagram: fallbackDiagramString,
      image_url: imageUrl,
      status: 'generated',
      parent_post_id: postId,
      version: currentVersion + 1,
      is_active: true
    };

    const supaRes = await fetchWithTimeout(supabaseCreateUrl, {
      method: 'POST',
      headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(insertBody)
    });

    if (!supaRes.ok) {
      throw new Error(`Failed to isolate new post version natively: ${await supaRes.text()}`);
    }

    const data = await supaRes.json();
    return NextResponse.json({ success: true, post: data[0] });

  } catch (error: any) {
    console.error("POST /api/regenerate Internal Trace Error:", error.message);
    return NextResponse.json({ success: false, error: 'Internal Server Error: Sequence regeneration halted securely.' }, { status: 500 });
  }
}
