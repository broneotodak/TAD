# Todak Annual Dinner 2025 - Event Management System

A comprehensive web-based event management system for the Todak Annual Dinner 2025, featuring table management, check-in system, and lucky draw functionality.

## Features

### 🏠 Landing Page
- Clean, modern interface with navigation to all sections
- Event information display
- Easy access to admin, check-in, and lucky draw pages

### 👨‍💼 Admin Panel
- **Secure Login**: Password-protected admin access (Password: `todak1q2w3e`)
- **Table Management**: 
  - Create and configure multiple tables
  - Set seats per table
  - Assign participants to tables manually or automatically
  - Visual table layout with participant lists
- **Participant Management**:
  - View all participants with VIP status
  - Search and filter functionality
  - Track check-in status
  - Assign/reassign table numbers
- **Quick Actions**:
  - Auto-assign participants to tables
  - Clear all table assignments
  - Export data as JSON
  - Generate QR code for check-in page
- **Statistics Dashboard**:
  - Total participants count
  - VIP guests count
  - Checked-in count
  - Total tables count

### ✅ Event Check-in
- **User-Friendly Interface**: 
  - Search participants by name or company
  - Visual feedback for VIP guests
  - Show if already checked in
- **Table Information**:
  - Display assigned table number
  - Show list of tablemates
  - Highlight VIP tablemates
- **Automatic Entry**: 
  - Participants are automatically entered into the lucky draw upon check-in
- **Real-time Stats**: 
  - Total guests and checked-in count displayed

### 🎰 Lucky Draw
- **Interactive Draw System**:
  - Animated name rolling effect
  - Stop and reveal winner with celebration animation
  - Display winner's name, company, and table number
- **Winner Management**:
  - Track all winners
  - Option to allow/disallow multiple wins per person
  - Remove winners from list if needed
  - Reset all winners
- **Eligibility**:
  - Only checked-in participants are eligible
  - Real-time count of eligible participants
- **Winners History**:
  - Display all winners with details
  - Chronological order

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Custom CSS with CSS Grid and Flexbox
- **Storage**: LocalStorage for data persistence
- **QR Code**: QRCode.js library
- **Fonts**: Google Fonts (Inter)

## Installation & Setup

1. **Clone/Download the project**
   ```bash
   cd /Users/broneotodak/Projects/TAD
   ```

2. **Start the web server**
   ```bash
   python3 -m http.server 8000
   ```
   Or use the npm script:
   ```bash
   npm start
   ```

3. **Access the application**
   Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## Usage Guide

### For Admins:

1. **Access Admin Panel**
   - Click "Admin Panel" on the landing page
   - Enter password: `todak1q2w3e`

2. **Setup Tables**
   - Enter the number of tables
   - Set seats per table (default: 10)
   - Click "Generate Tables"

3. **Assign Participants**
   - Use the dropdown in the participant table to manually assign
   - Or click "Auto-Assign All Tables" for automatic assignment (VIPs get priority)

4. **Generate QR Code**
   - Click "Generate Check-in QR"
   - Print or display the QR code at the event entrance
   - Participants scan this to access the check-in page

### For Event Check-in Staff:

1. **Access Check-in Page**
   - Scan the QR code provided by admin
   - Or navigate directly to `checkin.html`

2. **Check-in Process**
   - Guest searches for their name
   - Select the correct person from results
   - Verify table number and tablemates
   - Click "Confirm Check-in"

### For Lucky Draw:

1. **Access Lucky Draw Page**
   - Navigate to "Lucky Draw" from landing page

2. **Run the Draw**
   - Click "Start Lucky Draw" to begin animation
   - Click "Stop & Reveal Winner" to select a winner
   - Celebration animation will play

3. **Manage Winners**
   - All winners are listed below
   - Option to allow previous winners to win again
   - Reset winners if needed

## Data Structure

Participants are stored in `js/data.js` with the following structure:

```javascript
{
  id: Number,           // Unique identifier
  name: String,         // Full name
  company: String,      // Company/Organization
  vip: Boolean,         // VIP status
  table: Number|null,   // Assigned table number
  checkedIn: Boolean    // Check-in status
}
```

## Data Persistence

All data is stored in browser's LocalStorage:
- `participants`: Participant data with table assignments and check-in status
- `tables`: Table configuration
- `luckyDrawWinners`: List of lucky draw winners
- `adminLoggedIn`: Admin login status

## Customization

### Colors
Edit the CSS variables in `css/style.css`:
```css
:root {
    --primary-color: #FF6B35;
    --secondary-color: #004643;
    --accent-color: #F8961E;
    --success-color: #06D6A0;
    --danger-color: #EF476F;
}
```

### Admin Password
Change the password in `js/admin.js`:
```javascript
const ADMIN_PASSWORD = 'todak1q2w3e';
```

### Participant Data
Update the participant list in `js/data.js`

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Notes

- Data is stored locally in the browser
- Clear browser data will reset all information
- For production use, consider implementing a backend database
- QR code generation requires internet connection for the QRCode.js library

## Deployment

### GitHub Repository
The project is hosted at: https://github.com/broneotodak/TAD

### Netlify Deployment via GitHub:

1. **Deploy to Netlify**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Choose GitHub and select the `broneotodak/TAD` repository
   - Build settings: None needed (static site)
   - Click "Deploy site"

2. **Custom Domain (Optional)**
   - In Netlify dashboard, go to Domain settings
   - Add your custom domain

3. **Update Changes**
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
   Netlify will automatically redeploy!

## Project Structure

```
TAD/
├── index.html              # Landing page
├── admin.html             # Admin panel
├── checkin.html           # Check-in page
├── lucky-draw.html        # Lucky draw page
├── css/
│   └── style.css         # All styles
├── js/
│   ├── data.js           # Participant data
│   ├── admin.js          # Admin functionality
│   ├── checkin.js        # Check-in functionality
│   └── lucky-draw.js     # Lucky draw functionality
├── package.json          # Project metadata
└── README.md            # This file
```

## License

MIT License

## Author

Neo Todak

## Support

For issues or questions, please contact the development team.

---

**Event Details:**
- Date: December 2025
- Venue: Grand Ballroom
- Time: 7:00 PM

Enjoy the Todak Annual Dinner 2025! 🎉

