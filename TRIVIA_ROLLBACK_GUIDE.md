# 🔄 Trivia Feature Rollback Guide

This guide explains how to safely rollback the Trivia feature if needed.

## ⚠️ Important Notes

- **Rollback will DELETE all trivia data** (sessions, questions, answers)
- This action is **irreversible**
- Make sure to export any important data before rolling back

## Rollback Steps

### Option 1: Disable Feature (Recommended - No Data Loss)

If you just want to hide the feature without deleting data:

1. **Disable trivia for all events:**
   - Go to Admin Dashboard → Edit Event
   - Uncheck "Trivia" feature
   - Save changes

2. **Remove UI elements** (optional):
   - Remove trivia button from Quick Actions in `event-manage.html`
   - Remove trivia link from participant pages

3. **Data remains intact** - you can re-enable later

### Option 2: Complete Rollback (Deletes All Data)

If you want to completely remove the feature:

#### Step 1: Export Data (Optional but Recommended)

Before rolling back, you may want to export trivia data:

```sql
-- Run these queries in your database to export data
SELECT * FROM trivia_sessions;
SELECT * FROM trivia_questions;
SELECT * FROM trivia_answers;
```

#### Step 2: Run Rollback Script

Call the rollback API endpoint:

```bash
curl -X POST https://your-site.netlify.app/api/rollback-trivia-feature \
  -H "Content-Type: application/json" \
  -d '{"confirm": "DELETE_TRIVIA_DATA"}'
```

Or use the browser console:

```javascript
fetch('/api/rollback-trivia-feature', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ confirm: 'DELETE_TRIVIA_DATA' })
})
.then(r => r.json())
.then(console.log);
```

#### Step 3: Remove Code Files (Optional)

If you want to completely remove the code:

**Delete API endpoints:**
- `netlify/functions/migrate-trivia-feature.js`
- `netlify/functions/rollback-trivia-feature.js`
- `netlify/functions/create-trivia-session.js`
- `netlify/functions/get-trivia-session.js`
- `netlify/functions/add-trivia-question.js`
- `netlify/functions/submit-trivia-answer.js`
- `netlify/functions/get-trivia-leaderboard.js`
- `netlify/functions/start-trivia-session.js`
- `netlify/functions/end-trivia-session.js`

**Delete UI files:**
- `trivia-admin.html` (if created)
- `trivia.html` (if created)
- `js/trivia-admin.js` (if created)
- `js/trivia.js` (if created)

**Remove from event-manage.html:**
- Remove trivia button from Quick Actions
- Remove trivia-related JavaScript functions

**Remove from other pages:**
- Remove trivia links/buttons from participant-facing pages

#### Step 4: Remove Feature Toggle

In `event-manage.html`, remove trivia checkbox from event features form.

## Verification

After rollback, verify:

1. ✅ Trivia tables don't exist in database
2. ✅ No trivia-related errors in console
3. ✅ Event features don't include trivia option
4. ✅ No trivia buttons/links visible in UI

## Re-enabling After Rollback

If you rolled back but want to re-enable:

1. Run migration again: `/api/migrate-trivia-feature`
2. Re-add code files (if deleted)
3. Enable trivia feature for events

## Questions?

If you encounter issues during rollback, check:
- Database connection is working
- You have admin access
- No active trivia sessions are running
