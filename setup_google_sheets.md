# Google Sheets Setup Guide

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Rename it to "Water Bottle App Data"
4. Create two sheets (tabs at bottom):
   - Sheet1: Rename to `Users`
   - Sheet2: Rename to `Deliveries`

## Step 2: Set Up Sheet Headers

### Users Sheet (first row):
```
id | name | phone | address | defaultBottles | createdAt
```

### Deliveries Sheet (first row):
```
id | userId | date | bottles | notes | createdAt
```

## Step 3: Create Google Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any existing code
3. Copy and paste the code from `google-apps-script.js` file
4. Click **Save** (Ctrl+S)
5. Name your project: "Water Bottle API"

## Step 4: Deploy as Web App

1. Click **Deploy > New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Set the following:
   - Description: "Water Bottle API"
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Click **Authorize access** and allow permissions
6. **Copy the Web App URL** - you'll need this!

## Step 5: Update the App

1. Open `app.js`
2. Find this line at the top:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_SCRIPT_URL_HERE';
   ```
3. Replace `YOUR_GOOGLE_SCRIPT_URL_HERE` with your Web App URL

## Step 6: Test

1. Refresh your app in the browser
2. Add a user - it should appear in Google Sheets!
3. Check both devices - data should sync!

---

## Troubleshooting

### "Authorization required" error
- Make sure you authorized the script in Step 4

### Data not syncing
- Check if the Web App URL is correct
- Check browser console for errors (F12 > Console)

### CORS errors
- The script handles CORS automatically, but try redeploying

### Need to update the script?
1. Make changes in Apps Script
2. Go to Deploy > Manage deployments
3. Click the pencil icon
4. Select "New version"
5. Click Deploy
