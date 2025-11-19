// Attendance Data - All 313 participants
const attendanceData = [
  // VIP Section (first 5 are VIPs marked in red)
  { id: 1, name: "Khairul Azlan Bin Zainal Ariffin", company: "THSB", vip: true, table: null, checkedIn: false },
  { id: 2, name: "Nur Hylen Shamirah Binti Nasharuddin", company: "HSB", vip: true, table: null, checkedIn: false },
  { id: 3, name: "Ibu Shinta", company: "PT TODAK", vip: true, table: null, checkedIn: false },
  { id: 4, name: "Mohd Tariq Bin Ariffin Ali", company: "THSB", vip: true, table: null, checkedIn: false },
  { id: 5, name: "Ahmad Fadli bin Ahmad Dahlan", company: "TSSB", vip: true, table: null, checkedIn: false },
  
  // Regular Attendees
  { id: 6, name: "Mohamad Taufik Rizal Bin Aminuddin", company: "TASB", vip: false, table: null, checkedIn: false },
  { id: 7, name: "Mohd Ikmal Fareeq Bin Shamsul Bahri", company: "TFSB", vip: false, table: null, checkedIn: false },
  { id: 8, name: "Nurul Hakimi Haque Bin Fazlul Haque", company: "TCSB", vip: false, table: null, checkedIn: false },
  { id: 9, name: "Mohd Hafiz Bin Mohd Ismail", company: "TDSB", vip: false, table: null, checkedIn: false },
  { id: 10, name: "Roslan Bin Rashid", company: "TPSB", vip: false, table: null, checkedIn: false },
  { id: 11, name: "Muhammad Fadzli Bin Ab Rahim", company: "MTSB", vip: false, table: null, checkedIn: false },
  { id: 12, name: "Muhammad Saiful Amirul Bin Nasharuddin", company: "MTSB", vip: false, table: null, checkedIn: false },
  { id: 13, name: "Muhammad Hakim Qursin bin Sharim Bakari", company: "HSB", vip: false, table: null, checkedIn: false },
  { id: 14, name: "Ezril Ezrin Bin Ab Rahman", company: "TRC", vip: false, table: null, checkedIn: false },
  { id: 15, name: "Muhammad Zaid Ariffuddin Bin Zainal Ariffin", company: "10CAMP", vip: false, table: null, checkedIn: false },
  { id: 16, name: "Aiman Syafiq Bin Zolkipli", company: "MH", vip: false, table: null, checkedIn: false },
  { id: 17, name: "Syaiful Bakhtiar Bin Ahmad Fauzi", company: "STSB", vip: false, table: null, checkedIn: false },
  { id: 18, name: "Syed Syazni Bin Syed Husin Affandi", company: "HD Nusantara", vip: false, table: null, checkedIn: false },
  { id: 19, name: "Hazil Azran", company: "HD Nusantara", vip: false, table: null, checkedIn: false },
  { id: 20, name: "Muhammad Affiq Darimy Bin Hazil Azran", company: "HD Nusantara", vip: false, table: null, checkedIn: false }
];