const { google } = require('googleapis');
const env = require('../../config/env.js');

let _sheetsClient = null;

async function getSheetsClient() {
  if (_sheetsClient) return _sheetsClient;
  
  const auth = new google.auth.GoogleAuth({
    keyFile: env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const client = await auth.getClient();
  _sheetsClient = google.sheets({ version: 'v4', auth: client });
  return _sheetsClient;
}

function sanitizeInputString(text) {
  if (typeof text !== 'string') return '';
  // Strip out HTML tags, script brackets, and raw binary execution strings
  return text.replace(/[<>{}\\]/g, '').trim();
}

/**
 * Fetches rows where status = "pending", sorts by priority (descending).
 */
async function fetchPendingTopics() {
  const sheets = await getSheetsClient();
  const range = `${env.GOOGLE_SHEET_NAME}!A:G`;
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: env.GOOGLE_SHEET_ID,
      range: range,
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return []; // Empty or just headers

    const topics = [];

    // Assuming columns: [0]id | [1]topic | [2]status | [3]priority | [4]source | [5]created_at | [6]used_at
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[2] && row[2].toLowerCase() === 'pending') {
        topics.push({
          rowIndex: i + 1, // 1-based index (header is row 1)
          id: row[0],
          topic: sanitizeInputString(row[1]),
          status: row[2],
          priority: parseInt(row[3]) || 0,
          source: row[4]
        });
      }
    }

    // Sort by priority (high to low)
    topics.sort((a, b) => b.priority - a.priority);
    return topics;
  } catch (err) {
    if (err.message.includes('403') || err.message.includes('404')) {
      throw new Error(`Google Sheets Access Error (${err.code}): Check permissions and Sheet ID.`);
    }
    throw err;
  }
}

/**
 * Updates the 'status' and (if used) 'used_at' columns for a specific row.
 */
async function updateTopicStatus(rowIndex, status) {
  const sheets = await getSheetsClient();
  const usedAt = status === 'used' ? new Date().toISOString() : '';
  
  // Status is Column C, used_at is Column G
  const rangeStatus = `${env.GOOGLE_SHEET_NAME}!C${rowIndex}`;
  const rangeUsedAt = `${env.GOOGLE_SHEET_NAME}!G${rowIndex}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: env.GOOGLE_SHEET_ID,
    range: rangeStatus,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [[status]] },
  });

  if (usedAt) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: env.GOOGLE_SHEET_ID,
      range: rangeUsedAt,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[usedAt]] },
    });
  }
}

module.exports = {
  fetchPendingTopics,
  updateTopicStatus
};
