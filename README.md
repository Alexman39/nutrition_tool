# Nutrition Plan Parser MVP

Static front-end tool for parsing raw Greek nutrition text into a premium one-page preview.

## Stack
- HTML
- CSS
- Vanilla JavaScript
- localStorage only
- No backend
- No database

## Files
- `index.html`
- `style.css`
- `app.js`
- `README.md`
- `.nojekyll`

## Features
- Paste raw Greek nutrition plan text
- Parse variable number of meals
- Detect notes / remarks sections
- Render clean preview for screenshot or print to PDF
- Save current work locally in the browser

## Deploy to GitHub Pages
1. Create a new GitHub repository.
2. Upload all files to the repo root.
3. Commit and push.
4. In GitHub repo settings, open **Pages**.
5. Set source to **Deploy from branch**.
6. Choose the main branch and root folder.
7. Save and wait for the Pages URL.

## Deploy to Netlify
1. Create a new site from Git.
2. Connect the repository.
3. No build command needed.
4. Publish directory: `/`
5. Deploy.

## Notes
This MVP is intentionally static and simple so it can later be upgraded with:
- athlete profile saving
- training tabs
- richer parsing rules
- exports
- optional backend
