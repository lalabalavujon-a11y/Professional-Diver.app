# Populate Lessons Instructions

## Quick Fix: Add Lessons to All Tracks

Once your application is running and accessible at http://localhost:3000, you can populate lessons by:

### Method 1: Browser Console (Easiest)
1. Open http://localhost:3000 in your browser
2. Press F12 to open Developer Tools
3. Go to the Console tab
4. Paste and run this command:

```javascript
fetch('/api/admin/populate-lessons', { method: 'POST' })
  .then(res => res.json())
  .then(data => {
    console.log('✅ Success!', data);
    alert(`Lessons populated! Added ${data.lessonsAdded} lessons.`);
    location.reload(); // Refresh the page to see the lessons
  })
  .catch(err => {
    console.error('❌ Error:', err);
    alert('Error populating lessons. Check console for details.');
  });
```

### Method 2: Using curl (Terminal)
```bash
curl -X POST http://localhost:5000/api/admin/populate-lessons
```

### Method 3: Using a REST Client
- URL: `http://localhost:5000/api/admin/populate-lessons`
- Method: `POST`
- Headers: None required

## What This Does
- Fetches all published tracks from the database
- Checks each track - if it already has lessons, it skips it
- Adds lessons to tracks that don't have any yet
- Uses content from:
  - `content/ndt-lessons.js` for NDT tracks
  - `content/alst-lessons.js` for ALST tracks  
  - `content/lst-lessons.js` for LST tracks
  - `additional-lessons.js` for other professional tracks

## After Populating
1. Refresh the Learning Tracks page
2. Click on any track to view its detail page
3. You should now see lessons listed under each track!







