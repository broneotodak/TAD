# 🚀 Public Flow Redesign - Implementation Status

## ✅ Phase 1: Database Schema (COMPLETED)

### What Was Done:
- ✅ Created `update-schema-tentative.js` migration
- ✅ Added `tentative` TEXT column to events table
- ✅ Added `menu` TEXT column to events table
- ✅ Updated `create-event.js` to accept tentative/menu
- ✅ Deployed to Netlify

### Next Step for User:
**Run the schema migration:**
```
https://todakinternalevent.netlify.app/api/update-schema-tentative
```

You should see:
```json
{
  "success": true,
  "message": "Schema updated successfully - added tentative and menu columns"
}
```

---

## 📋 Remaining Phases

### Phase 2: Update Event Wizard (NEXT)
**Add tentative/menu input in event creation**

Files to modify:
- `event-wizard.html` - Add Step 5 for tentative/menu
- `js/event-wizard.js` - Add tentative/menu to eventData
- Update progress bar to show 5 steps instead of 4

Fields to add:
- **Tentative** (textarea) - Event schedule/timeline
- **Menu** (textarea) - Food menu if applicable

---

### Phase 3: Update QR Check-in Page
**Generate event-specific QR codes**

File: `qr-checkin.html`

Changes needed:
- Get event ID from URL parameter
- Generate QR code with: `checkin.html?event={id}&qr=true`
- Display event name and date
- Show QR code prominently for scanning

---

### Phase 4: Update Check-in Page (MAJOR)
**Complete redesign for participant experience**

File: `checkin.html`

New Features:
1. **Event Info Display**
   - Show event name, date, venue
   - Show tentative (if available)
   - Show menu (if available)
   - Beautiful card-based layout

2. **Device Lock**
   - Check localStorage: `checkedIn_event_{eventId}`
   - If already checked in → Show "Already checked in" message
   - If not → Allow search and check-in

3. **Search & Confirmation**
   - Search box for participant name
   - Show matching results
   - Click name → Confirmation dialog
   - Dialog: "Is this you? [Name] from [Company]"
   - Confirm → Check in

4. **Post Check-in Display**
   - Success message
   - Show table number (if assigned)
   - Show tablemates (if available)
   - Lock device (save to localStorage)
   - Auto-entered into lucky draw

5. **QR-Only Access**
   - Check URL parameter `?qr=true`
   - If not present → Redirect to landing page
   - Only accessible via QR scan

---

### Phase 5: Update Lucky Draw (Admin Only)
**Move lucky draw to admin-only access**

File: `admin-lucky-draw.html` (new file)

Features:
- Get event ID from URL: `?event={id}`
- Check if event has lucky draw feature enabled
- If not enabled → Show message
- If enabled → Show lucky draw interface
- Only draw from checked-in participants
- Full-screen mode for projector
- Same animation as current lucky draw

Integration:
- Add link in `event-manage.html` (admin page)
- Add link in `admin-dashboard.html` event cards
- Only show if event.features.luckyDraw === true

---

### Phase 6: Update Landing Page
**Remove direct access to check-in/lucky draw**

File: `index.html`

Changes:
- Remove check-in and lucky draw buttons from event cards
- Keep "Admin Dashboard" link
- Show event info only
- Add note: "Scan QR code at venue to check in"

---

## 🎯 Implementation Order

1. ✅ **Phase 1: Database** (DONE)
2. **Phase 2: Event Wizard** - Add tentative/menu input
3. **Phase 3: QR Page** - Generate event-specific QR
4. **Phase 4: Check-in Page** - Complete redesign
5. **Phase 5: Lucky Draw** - Admin-only access
6. **Phase 6: Landing Page** - Remove public links

---

## 📝 Key Design Decisions

### Device Lock Strategy:
```javascript
// localStorage key format
const lockKey = `checkedIn_event_${eventId}`;

// After successful check-in
localStorage.setItem(lockKey, JSON.stringify({
  participantId: participant.id,
  participantName: participant.name,
  checkedInAt: new Date().toISOString(),
  tableNumber: participant.table
}));

// On page load
const existingCheckIn = localStorage.getItem(lockKey);
if (existingCheckIn) {
  // Show "Already checked in" view
  // Display their info
  // Lock the page
}
```

### QR Code Format:
```
https://todakinternalevent.netlify.app/checkin.html?event=1&qr=true
```

- `event=1` - Event ID
- `qr=true` - Indicates QR access (required)

### Tentative Format (Suggested):
```
18:00 - Registration & Welcome Drinks
19:00 - Dinner Starts
20:00 - Opening Speech
20:30 - Entertainment
21:30 - Lucky Draw
22:00 - Event Ends
```

### Menu Format (Suggested):
```
Appetizer: Caesar Salad
Main Course: Grilled Salmon / Beef Wellington
Dessert: Chocolate Lava Cake
Beverages: Wine, Soft Drinks
```

---

## 🚀 Ready to Continue?

Phase 1 is complete and deployed. 

**Next step:** Run the schema migration, then I'll implement Phase 2 (Event Wizard updates).

Let me know when you're ready to continue! 🎯
