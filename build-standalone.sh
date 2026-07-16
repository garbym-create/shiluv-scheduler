#!/usr/bin/env bash
# בונה index.html עצמאי (ללא Node) מתוך src/App.jsx
set -e

# טרנספורם: הסרת import והחלפה בפירוק גלובלי; הסרת export default
BODY=$(sed \
  -e "s/^import React, { useState, useMemo, useEffect } from 'react';/const { useState, useMemo, useEffect } = React;/" \
  -e "s/^export default function App()/function App()/" \
  src/App.jsx)

{
cat <<'HTML_HEAD'
<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>מערכת שיבוץ שילוב</title>
  <meta name="description" content="לוח בקרה לשיבוץ אוטומטי של טיפולים שבועיים לתלמידי שילוב" />
  <script crossorigin src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone@7.25.6/babel.min.js"></script>
  <style>
    html,body{ margin:0; padding:0; }
    #loading{ font-family:system-ui,sans-serif; text-align:center; padding:80px 20px; color:#616A75; }
  </style>
</head>
<body>
  <div id="root"><div id="loading">טוען את המערכת…</div></div>
  <script type="text/babel" data-presets="react">
HTML_HEAD

printf '%s\n' "$BODY"

cat <<'HTML_TAIL'

const rootEl = document.getElementById('root');
rootEl.innerHTML = '';
ReactDOM.createRoot(rootEl).render(React.createElement(React.StrictMode, null, React.createElement(App)));
  </script>
</body>
</html>
HTML_TAIL
} > index.html

echo "נבנה index.html ($(wc -l < index.html) שורות)"
grep -n "from 'react'" index.html || echo "OK: אין import שנשאר"
grep -n "export default" index.html || echo "OK: אין export שנשאר"
