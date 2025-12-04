# Participant List Upload Guide

## Overview
This guide helps admins create participant lists for event uploads. **CSV format is recommended** for the most reliable upload experience.

## Supported File Formats
- ✅ **CSV** (Recommended - Most reliable)
- ✅ **Excel** (.xlsx, .xls)
- ⚠️ **PDF** (May have parsing issues - Use CSV instead)

## CSV Template Format

### Required Columns
Your CSV file must include these columns in this exact order:

1. **Number** (Required)
   - Sequential numbering (1, 2, 3, ...)
   - Used for tracking and reference

2. **Company** (Required)
   - Column header: `Company`, `Organization`, or `Syarikat`
   - Contains the company/organization name
   - Leave empty if participant has no company

3. **Full Name** (Required)
   - Column header: `Full Name`, `Name`, or `Nama`
   - Contains the participant's complete name

### Standard CSV Format (With Headers)

```csv
Number,Company,Full Name
1,Acme Corporation,John Doe
2,Tech Solutions Inc.,Jane Smith
3,Global Industries,Bob Johnson
4,VIP Guest,Alice Williams
5,Startup Co.,Michael Brown
```

### Alternative Format (Without Headers)
If you prefer a simpler format without headers:

```csv
1,Acme Corporation,John Doe
2,Tech Solutions Inc.,Jane Smith
3,Global Industries,Bob Johnson
```

**Format:** `Number, Company, Full Name`

## Excel Template Format

When creating an Excel file, follow the same column structure:

| Number | Company | Full Name |
|--------|---------|-----------|
| 1 | Acme Corporation | John Doe |
| 2 | Tech Solutions Inc. | Jane Smith |
| 3 | Global Industries | Bob Johnson |

### Excel Tips
- Use the first row for column headers: `Number`, `Company`, `Full Name`
- Number column should be numeric (1, 2, 3, ...)
- Avoid merged cells or complex formatting
- Keep it simple - only these three columns are needed

## Common Issues & Solutions

### ❌ Issue: "Could not find name column"
**Solution:** Make sure your CSV has a column header containing "Name", "Full Name", or "Nama"

### ❌ Issue: PDF upload fails
**Solution:** Convert your PDF to CSV format using the template above. PDF parsing relies on AI and can be unreliable. Download the CSV template and fill it in manually.

### ❌ Issue: Wrong column order
**Solution:** Ensure columns are in this exact order: `Number, Company, Full Name`

### ❌ Issue: Empty rows causing errors
**Solution:** Remove any empty rows between data entries

## Best Practices

1. ✅ **Use CSV format** for best reliability
2. ✅ **Include column headers** in the first row: `Number, Company, Full Name`
3. ✅ **Follow the exact column order**: Number, Company, Full Name
4. ✅ **Save as UTF-8** encoding to avoid character issues
5. ✅ **Test with a small file first** (5-10 participants)
6. ✅ **Use sequential numbering** starting from 1
7. ❌ **Avoid special characters** in names/companies that might break CSV parsing
8. ❌ **Don't use merged cells** in Excel files
9. ❌ **Don't include empty rows** between data
10. ❌ **Don't add extra columns** - only Number, Company, and Full Name are needed

## Quick Start

1. **Download the template** from the upload modal in Event Management page
2. Open in Excel, Google Sheets, or any text editor
3. Fill in your participant data:
   - Column 1: Sequential number (1, 2, 3, ...)
   - Column 2: Company name
   - Column 3: Participant's full name
4. Save as CSV (UTF-8 encoding recommended)
5. Upload via the Event Management page upload button

## Template Download

Templates are available for download directly from the upload modal in the Event Management page. Look for the "📥 Download CSV Template" button when you click "Upload List".

## Need Help?

If you encounter issues:
1. Check that your file matches the template format
2. Try opening your CSV in a text editor to verify formatting
3. Ensure there are no hidden characters or encoding issues
4. Contact support with a sample of your file format
