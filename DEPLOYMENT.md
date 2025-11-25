# 🚀 Deployment Guide - Multi-Event System

## Prerequisites
- Netlify account
- Neon database (already set up)
- OpenAI API key

---

## Step 1: Add Environment Variables to Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variables:

### Required Variables:

```
NETLIFY_DATABASE_URL
```
Value: Your Neon database connection string (already configured)

```
OPENAI_API_KEY
```
Value: `sk-proj-YOUR_OPENAI_API_KEY_HERE` (Get from OpenAI dashboard)

---

## Step 2: Run Database Migration

After deploying to Netlify, run the migration to add multi-event support:

1. Open your browser
2. Navigate to: `https://your-site.netlify.app/api/migrate-to-multi-event`
3. You should see a success message with migration summary
4. This will:
   - Create the `events` table
   - Add `event_id` columns to existing tables
   - Create a default "Todak Annual Dinner 2025" event
   - Link all existing data to this event

**⚠️ Important:** Run this migration ONLY ONCE after deployment!

---

## Step 3: Deploy to Netlify

### Option A: Git Push (Recommended)

```bash
git add .
git commit -m "Add multi-event system with AI participant upload"
git push origin main
```

Netlify will automatically detect changes and redeploy.

### Option B: Manual Deploy

1. Drag and drop the entire project folder to Netlify
2. Wait for deployment to complete

---

## Step 4: Verify Deployment

1. Visit your site: `https://your-site.netlify.app`
2. You should see the updated landing page
3. Go to Admin Dashboard: `https://your-site.netlify.app/admin-dashboard.html`
4. Login with password: `todak1q2w3e`
5. You should see the "Todak Annual Dinner 2025" event listed

---

## New Pages & Features

### Admin Pages (🔐 Password Protected)
- `/admin-dashboard.html` - Main dashboard with all events
- `/event-wizard.html` - Create new event (4-step wizard)
- `/event-manage.html?id={eventId}` - Manage specific event (updated admin.html)

### Public Pages (👤 Accessible to participants)
- `/checkin.html?event={eventId}` - Check-in page (event-specific)
- `/lucky-draw.html?event={eventId}` - Lucky draw (event-specific)

---

## Testing the New Features

### 1. Test Event Creation
1. Go to Admin Dashboard
2. Click "Create New Event"
3. Follow the 4-step wizard:
   - Step 1: Enter event details
   - Step 2: Select event type
   - Step 3: Choose features (attendance, tables, lucky draw)
   - Step 4: Upload participant list (optional)

### 2. Test AI Participant Upload
1. In Step 4 of event creation, upload a PDF/CSV/Excel file
2. The AI will extract participant data automatically
3. Review the extracted data after event creation

### 3. Test Theme Toggle
1. Click the 🌓 button in the header
2. Theme should switch between dark and light modes
3. Preference is saved to localStorage

---

## Troubleshooting

### Migration fails
- Check that `NETLIFY_DATABASE_URL` is correctly set
- Ensure Neon database is accessible
- Check Netlify function logs for errors

### AI extraction not working
- Verify `OPENAI_API_KEY` is correctly set in Netlify
- Check that the API key is valid and has credits
- Review Netlify function logs for API errors

### Events not showing
- Run the migration first: `/api/migrate-to-multi-event`
- Check browser console for errors
- Verify database connection

---

## API Endpoints

### New Endpoints:
- `POST /api/create-event` - Create new event
- `GET /api/get-events` - Get all events
- `GET /api/get-event?id={id}` - Get single event
- `POST /api/update-event` - Update event
- `POST /api/upload-participants-ai` - AI extraction
- `POST /api/add-participants-bulk` - Bulk add participants
- `GET /api/migrate-to-multi-event` - Run migration (once)

### Updated Endpoints:
- `GET /api/get-participants?eventId={id}` - Now event-aware
- `POST /api/save-participants` - Now requires eventId

---

## Migration Summary

The migration will output something like:

```json
{
  "success": true,
  "message": "Multi-event migration completed successfully",
  "summary": {
    "defaultEventId": 1,
    "totalEvents": 1,
    "participantsMigrated": 150,
    "tablesMigrated": 15,
    "winnersMigrated": 0
  }
}
```

---

## Next Steps

1. ✅ Deploy to Netlify
2. ✅ Add environment variables
3. ✅ Run migration
4. ✅ Test event creation
5. ✅ Test AI participant upload
6. 🎉 Start using the multi-event system!

---

## Support

For issues or questions:
- Check Netlify function logs
- Review browser console
- Verify environment variables are set correctly
