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

4. **VIP** (Optional)
   - Column header: `VIP` or `Status`
   - Mark VIP participants with: `true`, `1`, `yes`, `VIP`, or `VVIP` (case-insensitive)
   - Mark non-VIP with: `false`, `0`, `no`, or leave empty
   - Default: `false` if not specified

### Standard CSV Format (With Headers)

**⚠️ IMPORTANT: The header row must be exactly:** `Number,Company,Full Name,VIP`

**DO NOT duplicate column headers** - Make sure the 4th column header says "VIP", not "Full Name" again!

```csv
Number,Company,Full Name,VIP
1,Acme Corporation,John Doe,false
2,Tech Solutions Inc.,Jane Smith,false
3,Global Industries,Bob Johnson,false
4,VIP Guest,Alice Williams,true
5,Startup Co.,Michael Brown,false
```

**Common mistake:** `Number,Company,Full Name,Full Name` ❌ (Wrong - duplicate header)  
**Correct format:** `Number,Company,Full Name,VIP` ✅

### Alternative Format (Without Headers)
If you prefer a simpler format without headers:

```csv
1,Acme Corporation,John Doe,false
2,Tech Solutions Inc.,Jane Smith,false
3,Global Industries,Bob Johnson,false
```

**Format:** `Number, Company, Full Name, VIP` (VIP is optional)

## Excel Template Format

When creating an Excel file, follow the same column structure:

| Number | Company | Full Name | VIP |
|--------|---------|-----------|-----|
| 1 | Acme Corporation | John Doe | false |
| 2 | Tech Solutions Inc. | Jane Smith | false |
| 3 | Global Industries | Bob Johnson | false |
| 4 | VIP Guest | Alice Williams | true |

### Excel Tips
- Use the first row for column headers: `Number`, `Company`, `Full Name`, `VIP`
- Number column should be numeric (1, 2, 3, ...)
- VIP column: Use `true`/`false`, `yes`/`no`, `1`/`0`, or `VIP`/`VVIP` (case-insensitive)
- Avoid merged cells or complex formatting
- VIP column is optional - you can leave it empty or use `false` for non-VIP participants

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
2. ✅ **Include column headers** in the first row: `Number, Company, Full Name, VIP`
3. ✅ **Follow the exact column order**: Number, Company, Full Name, VIP
4. ✅ **Save as UTF-8** encoding to avoid character issues
5. ✅ **Test with a small file first** (5-10 participants)
6. ✅ **Use sequential numbering** starting from 1
7. ✅ **Mark VIP status** using: `true`, `1`, `yes`, `VIP`, or `VVIP` (case-insensitive)
8. ❌ **Avoid special characters** in names/companies that might break CSV parsing
9. ❌ **Don't use merged cells** in Excel files
10. ❌ **Don't include empty rows** between data
11. ❌ **VIP column is optional** - you can leave it empty or use `false` for non-VIP participants

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
