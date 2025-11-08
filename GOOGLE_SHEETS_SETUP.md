# Google Sheets Setup Guide

This guide explains how to configure Google Sheets integration for the Phonix Printer website.

## Configuration File

The file `google-sheets-config.json` contains the configuration for linking with Google Sheets.

### File Structure

```json
{
  "apiKey": "YOUR_GOOGLE_SHEETS_API_KEY",
  "sheetId": "YOUR_GOOGLE_SHEET_ID",
  "email": "your-email@example.com",
  "sheetName": "Sheet1",
  "authMethod": "apiKey",
  "serviceAccountFile": "kay.json"
}
```

### Configuration Fields

- **apiKey**: Your Google Sheets API key (obtained from Google Cloud Console)
- **sheetId**: The ID of your Google Sheet (found in the sheet URL)
- **email**: The email address associated with the Google Sheet (service account email or your Google account)
- **sheetName**: The name of the sheet tab (usually "Sheet1")
- **authMethod**: Authentication method ("apiKey" for API key, "serviceAccount" for service account)
- **serviceAccountFile**: Path to service account JSON file (if using service account)

## Setup Steps

### 1. Get Google Sheets API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"
4. Create an API key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key
5. (Optional) Restrict the API key:
   - Click on the API key to edit it
   - Under "API restrictions", select "Restrict key"
   - Choose "Google Sheets API"
   - Save

### 2. Get Your Google Sheet ID

1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
3. Copy the `SHEET_ID_HERE` part

### 3. Share Your Google Sheet

**For Public Sheets:**
- The sheet should be publicly readable
- Go to "Share" > "Get link" > "Anyone with the link" > "Viewer"

**For Private Sheets:**
- Share the sheet with the service account email (if using service account)
- Or share with your Google account email
- Make sure the account has at least "Viewer" permissions

### 4. Update Configuration File

1. Open `google-sheets-config.json`
2. Update the following fields:
   - `apiKey`: Your Google Sheets API key
   - `sheetId`: Your Google Sheet ID
   - `email`: Your Google account email or service account email
   - `sheetName`: The name of your sheet tab (if different from "Sheet1")

### 5. Test the Connection

1. Start the server: `npm start`
2. Visit: `http://localhost:3000/discussion.html`
3. Check the browser console and server logs for any errors
4. The page should load data from Google Sheets automatically

## Troubleshooting

### Error: API Key authentication failed (403)

**Solutions:**
1. Check that the API key is correct in `google-sheets-config.json`
2. Verify that Google Sheets API is enabled in Google Cloud Console
3. Check API key restrictions in Google Cloud Console
4. Make sure the sheet is shared with the correct email
5. Verify the sheet is publicly accessible (if using public access)

### Error: Sheet not found (404)

**Solutions:**
1. Check that the Sheet ID is correct in `google-sheets-config.json`
2. Verify the sheet exists and is accessible
3. Check the sheet URL to confirm the Sheet ID

### Error: Bad request (400)

**Solutions:**
1. Check the sheet name in `google-sheets-config.json`
2. Verify the sheet tab name matches exactly
3. Check server logs for detailed error messages

### Data not loading

**Solutions:**
1. Check browser console for errors
2. Check server logs for API errors
3. Verify the sheet has data in it
4. Check that the sheet is shared correctly
5. Try refreshing the page or clicking "تحديث البيانات" (Refresh Data)

## Security Notes

- **DO NOT** commit `google-sheets-config.json` to public repositories
- The file is already added to `.gitignore`
- For production, use environment variables instead of the config file
- Keep your API key secure and don't share it publicly

## Environment Variables (Alternative)

Instead of using the config file, you can set environment variables:

```bash
GOOGLE_SHEETS_API_KEY=your-api-key-here
```

The server will use environment variables if they are set, otherwise it will use the config file.

## Support

If you encounter any issues:
1. Check the server logs for error messages
2. Check the browser console for errors
3. Verify all configuration values are correct
4. Ensure Google Sheets API is enabled
5. Make sure the sheet is accessible

## Current Configuration

- **API Key**: Configured in `google-sheets-config.json`
- **Sheet ID**: `1hfYLHn6peQLywoNpzVUbgrhI5w-y1xuckuGcbt2a0Ew`
- **Email**: `sait-phonex@woven-province-476401-p3.iam.gserviceaccount.com`
- **Auth Method**: API Key
- **Service Account File**: `kay.json` (for service account authentication if needed)

