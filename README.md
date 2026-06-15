# SQL Quest: Interactive SQL Learning Environment

SQL Quest is an interactive, single-page web application designed to welcome absolute beginners to SQL. It features an in-browser query engine, guided space-themed quests, a learning roadmap, and an AI SQL Playground.

## 🚀 Live Production URL
The project is hosted and accessible publicly at:
👉 **[https://opensigma-sqlquest.surge.sh](https://opensigma-sqlquest.surge.sh)**

---

## 🛠️ Local Development & Execution
Because this application runs entirely client-side, it requires no server setup:
1. Double-click **`index.html`** in your file manager to open it in Chrome, Edge, Firefox, or Safari.
2. Open your browser console to verify everything loads correctly.

---

## 📦 Automated Re-Deployment
If you make changes to the files (HTML, CSS, JS) and want to update the public live site, simply:
1. Double-click the **`deploy.bat`** file in Windows Explorer.
2. It will automatically duplicate `index.html` as `200.html` (to prevent route-refresh 404 errors) and publish the directory to Surge.

---

## 📁 File Manifest
*   `index.html`: Main workspace markup.
*   `styles.css`: CSS Variables and Tech-Editorial styling rules.
*   `database.js`: Isomorphic local database parsing engine.
*   `app.js`: Cursor insertions, syntax highlighting, and AI intent mapper.
*   `deploy.bat`: One-click deployment script.
*   `404.html`: Custom routing fallback page.
