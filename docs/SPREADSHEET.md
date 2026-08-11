# Spreadsheet Synchronization Guide (TargetMoneh)

**Version:** 1.0.0
**Reference:** [PRD-Personal-Savings-Tracker.md](PRD-Personal-Savings-Tracker.md)

TargetMoneh uses Google Sheets purely as an external reporting and audit mechanism. The PostgreSQL database remains the single source of truth.

---

## 1. Google Sheets Template Setup

You must create a Google Sheet to receive the data. 

1. Create a new Google Spreadsheet.
2. Create two tabs exactly named:
   - `Savings Goals Summary`
   - `Deposit & Withdrawal Log`
3. Note the **Spreadsheet ID** from the URL (the string between `/d/` and `/edit`).

---

## 2. Google Apps Script (GAS) Web App Deployment

To receive data from Supabase, you must deploy a Google Apps Script attached to the spreadsheet.

1. In your Google Sheet, go to **Extensions > Apps Script**.
2. Replace the `Code.gs` contents with a script that handles `doPost(e)`:

```javascript
// Basic example payload handler
const API_KEY = "YOUR_SECRET_CUSTOM_API_KEY"; // Generate a random string

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // 1. Validate API Key
    if (data.apiKey !== API_KEY) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Unauthorized" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 2. Clear and Update 'Savings Goals Summary'
    if (data.summary && data.summary.length > 0) {
      const summarySheet = ss.getSheetByName("Savings Goals Summary");
      summarySheet.clear();
      // Assuming data.summary is a 2D array: [[Header1, Header2], [Val1, Val2], ...]
      summarySheet.getRange(1, 1, data.summary.length, data.summary[0].length).setValues(data.summary);
    }
    
    // 3. Clear and Update 'Deposit & Withdrawal Log'
    if (data.logs && data.logs.length > 0) {
      const logSheet = ss.getSheetByName("Deposit & Withdrawal Log");
      logSheet.clear();
      logSheet.getRange(1, 1, data.logs.length, data.logs[0].length).setValues(data.logs);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Click **Deploy > New deployment**.
4. Select **Web app**.
5. Execute as: **Me**.
6. Who has access: **Anyone** (Your code checks the `API_KEY` for security).
7. Click **Deploy** and authorize the script.
8. Copy the **Web App URL**.

---

## 3. Connecting Supabase

Provide the Web App URL and API Key to your Supabase Edge Function environment variables:

```bash
supabase secrets set GAS_WEB_APP_URL="https://script.google.com/macros/s/.../exec"
supabase secrets set GAS_API_KEY="YOUR_SECRET_CUSTOM_API_KEY"
```

The Supabase Edge Function `sync-savings` will now use these credentials to push data to your spreadsheet when triggered by the client.
