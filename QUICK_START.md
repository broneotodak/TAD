# 🚀 Quick Start Guide - Multi-Event System

## For First-Time Setup

### 1. Deploy to Netlify
```bash
git add .
git commit -m "Add multi-event system"
git push origin main
```

### 2. Add Environment Variables
Go to Netlify Dashboard → Site Settings → Environment Variables

Add:
```
OPENAI_API_KEY = sk-proj-YOUR_OPENAI_API_KEY_HERE
```
(Use the API key you already added to Netlify)

### 3. Run Migration (ONE TIME ONLY)
Visit: `https://your-site.netlify.app/api/migrate-to-multi-event`

You should see:
```json
{
  "success": true,
  "message": "Multi-event migration completed successfully",
  "summary": {
    "defaultEventId": 1,
    "totalEvents": 1,
    "participantsMigrated": 150,
    "tablesMigrated": 15
  }
}
```

---

## Daily Usage

### Creating a New Event

1. **Go to Admin Dashboard**
   - URL: `https://your-site.netlify.app/admin-dashboard.html`
   - Password: `todak1q2w3e`

2. **Click "Create New Event"**

3. **Follow the Wizard:**
   - **Step 1:** Enter event name, date, venue, theme, times
   - **Step 2:** Select event type (Annual Dinner, Conference, etc.)
   - **Step 3:** Toggle features (Attendance, Tables, Lucky Draw)
   - **Step 4:** Upload participant list OR skip

4. **Click "Create Event"**

5. **Done!** You'll be redirected to the event management page

---

### Uploading Participants with AI

#### Option A: During Event Creation (Step 4)
1. Drag & drop your file (PDF, CSV, Excel)
2. AI will extract participant data automatically
3. Click "Create Event"

#### Option B: After Event Creation
1. Go to event management page
2. Click "Upload Participants" (future feature)
3. Upload file
4. Review and import

---

### Managing an Event

1. **Go to Admin Dashboard**
2. **Find your event card**
3. **Click "Manage"**
4. You'll see:
   - Participant list
   - Table assignments
   - Check-in status
   - Quick actions (auto-assign, clear tables, etc.)

---

### Checking In Participants

1. **Get the check-in URL:**
   - Format: `https://your-site.netlify.app/checkin.html?event={eventId}`
   - Generate QR code from event management page

2. **Participants scan QR code**

3. **They search for their name**

4. **Click "Confirm Check-in"**

5. **Done!** They're automatically entered into lucky draw

---

### Running Lucky Draw

1. **Open lucky draw page:**
   - URL: `https://your-site.netlify.app/lucky-draw.html?event={eventId}`

2. **Click "Start Lucky Draw"**

3. **Click "Stop & Reveal Winner"**

4. **Winner is displayed with celebration animation**

---

## Keyboard Shortcuts

- **Theme Toggle:** Click 🌓 button in header
- **Back to Dashboard:** Click "← Back to Dashboard" in header

---

## Tips & Tricks

### AI Upload Tips:
- ✅ Works with any document format
- ✅ No need for specific template
- ✅ AI detects VIP from titles (CEO, Director, etc.)
- ✅ Can handle messy/unstructured data
- ⚠️ Review extracted data before importing

### Event Management Tips:
- 🎯 Use "Auto-Assign All Tables" for quick setup
- 🎯 VIPs get priority in auto-assignment
- 🎯 Drag & drop participants between tables
- 🎯 Export data as JSON for backup

### Theme Tips:
- 🌓 Toggle between dark/light mode
- 🌓 Preference is saved automatically
- 🌓 Works on all pages

---

## Common Workflows

### Workflow 1: Create Event with Participant List
1. Admin Dashboard → Create New Event
2. Fill in event details
3. Select event type
4. Choose features
5. Upload participant file
6. Create Event
7. Review participants
8. Auto-assign tables
9. Generate QR code
10. Share with participants

### Workflow 2: Create Event, Add Participants Later
1. Admin Dashboard → Create New Event
2. Fill in event details
3. Select event type
4. Choose features
5. Skip participants
6. Create Event
7. Go to event management
8. Add participants manually OR upload file later

### Workflow 3: Manage Existing Event
1. Admin Dashboard
2. Find event card
3. Click "Manage"
4. View/edit participants
5. Assign tables
6. Generate QR code
7. Monitor check-ins

---

## Troubleshooting

### "No active event found"
- Make sure you've created at least one event
- Check that event is marked as "Active"

### AI extraction failed
- Check file format (PDF, CSV, Excel only)
- Verify OpenAI API key is set in Netlify
- Try a different file format

### Participants not showing
- Verify you're viewing the correct event
- Check that eventId is in the URL
- Refresh the page

### Theme not saving
- Check browser localStorage is enabled
- Clear cache and try again

---

## Quick Links

- **Admin Dashboard:** `/admin-dashboard.html`
- **Create Event:** `/event-wizard.html`
- **Manage Event:** `/event-manage.html?id={eventId}`
- **Check-in:** `/checkin.html?event={eventId}`
- **Lucky Draw:** `/lucky-draw.html?event={eventId}`

---

## Support

Need help? Check:
1. `IMPLEMENTATION_SUMMARY.md` - Full feature list
2. `DEPLOYMENT.md` - Deployment guide
3. `README.md` - Original documentation
4. Netlify function logs - For API errors
5. Browser console - For frontend errors

---

**Happy Event Managing! 🎉**
