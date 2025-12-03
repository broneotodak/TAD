# 🧠 Trivia Feature Setup Guide

Complete guide for setting up and using the Trivia Challenge feature.

## 📋 Prerequisites

1. **Run Database Migration First**
   - Visit: `https://your-site.netlify.app/api/migrate-trivia-feature`
   - Or call via curl/Postman
   - This creates the necessary database tables

2. **Enable Feature for Event**
   - Go to Admin Dashboard → Select Event → Edit Event
   - Check "Trivia Challenge" checkbox
   - Save changes

## 🚀 Quick Start

### For Admins:

1. **Create a Trivia Session**
   - Go to Event Management page
   - Click "🧠 Trivia Challenge" in Quick Actions
   - Enter a session title (e.g., "Round 1 - General Knowledge")
   - Click "Create Session"

2. **Add Questions**
   - Click "+ Add Question"
   - Fill in:
     - Question text
     - 4 options (A, B, C, D)
     - Correct answer
     - Time limit (default: 30 seconds)
     - Points (default: 10)
   - Click "Add Question"
   - Repeat for all questions

3. **Start the Session**
   - Review all questions
   - Click "▶️ Start Session"
   - Participants can now join and answer

4. **Monitor Progress**
   - View real-time leaderboard
   - See participant count
   - Track who's answering

5. **End the Session**
   - Click "⏹️ End Session" when done
   - Final leaderboard is displayed

### For Participants:

1. **Join Trivia**
   - Check in to the event first
   - Look for "Trivia Challenge" link/button
   - Or visit: `trivia.html?event=EVENT_ID`

2. **Answer Questions**
   - Wait for session to start
   - Read each question carefully
   - Select your answer (A, B, C, or D)
   - See immediate feedback
   - Timer shows remaining time

3. **View Results**
   - See your score after each question
   - View final stats when complete
   - Check leaderboard ranking

## 🎯 Features

- **Real-time Updates**: Leaderboard updates every 2 seconds
- **First Answer Bonus**: First correct answer gets full points, others get half
- **Timer**: Each question has a time limit
- **Progress Tracking**: See your score and progress in real-time
- **Leaderboard**: See how you rank against others

## ⚙️ Configuration

### Question Settings:
- **Time Limit**: 10-300 seconds per question
- **Points**: 1-100 points per question
- **Order**: Questions are answered in order

### Scoring System:
- **First Correct Answer**: Full points
- **Later Correct Answers**: Half points
- **Incorrect Answer**: 0 points

## 🔧 API Endpoints

All endpoints require the trivia feature to be enabled:

- `POST /api/create-trivia-session` - Create new session
- `GET /api/get-trivia-session?eventId=X` - Get active session
- `POST /api/add-trivia-question` - Add question
- `POST /api/submit-trivia-answer` - Submit answer
- `GET /api/get-trivia-leaderboard?sessionId=X` - Get leaderboard
- `POST /api/start-trivia-session` - Start session
- `POST /api/end-trivia-session` - End session

## 🐛 Troubleshooting

**"Trivia feature is not enabled"**
- Go to Event Settings → Enable Trivia checkbox

**"No trivia session available"**
- Admin needs to create and start a session

**"Session has no questions"**
- Admin needs to add questions before starting

**Answers not submitting**
- Check participant is checked in
- Verify session is active
- Check browser console for errors

## 📊 Performance Notes

- Leaderboard updates every 2 seconds (polling)
- Database handles concurrent answers efficiently
- First answer detection uses database timestamps (race-condition safe)
- Recommended max: 200 concurrent participants

## 🔄 Rollback

See `TRIVIA_ROLLBACK_GUIDE.md` for complete rollback instructions.

**Quick Disable (No Data Loss):**
1. Uncheck "Trivia Challenge" in event features
2. Feature is hidden but data remains

**Complete Removal:**
1. Export data (optional)
2. Call `/api/rollback-trivia-feature` with confirmation
3. Delete code files (optional)

## 📝 Best Practices

1. **Test First**: Create a test session with 2-3 questions
2. **Clear Instructions**: Tell participants how to join
3. **Monitor**: Watch leaderboard during session
4. **Time Limits**: Set reasonable time limits (30-60 seconds)
5. **Question Order**: Order questions from easy to hard
6. **Points**: Use consistent point values (e.g., all 10 points)

## 🎉 Tips for Success

- Start with 5-10 questions for first session
- Use 30-45 second time limits
- Make questions relevant to your event/company
- Announce when trivia is starting
- Display leaderboard on a screen for engagement
