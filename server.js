const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3333;
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

http.createServer((req, res) => {
  // Handle state persistence (sent/dismissed cards)
  if (req.method === 'POST' && req.url === '/api/update-state') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { action, cardId } = JSON.parse(body);
        const jsonPath = path.join(__dirname, 'data/dashboard.json');
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        data.sentCards = data.sentCards || {};
        data.dismissedCards = data.dismissedCards || {};
        if (action === 'markSent')    data.sentCards[cardId] = new Date().toISOString();
        if (action === 'unmarkSent')  delete data.sentCards[cardId];
        if (action === 'dismiss')     data.dismissedCards[cardId] = new Date().toISOString();
        if (action === 'undismiss')   delete data.dismissedCards[cardId];
        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  const filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain', 'Access-Control-Allow-Origin': '*' });
    res.end(data);
  });
}).listen(PORT, '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) { localIP = net.address; break; }
    }
  }
  console.log(`\n🚀 Command Center is running!\n`);
  console.log(`   Computer:  http://localhost:${PORT}`);
  console.log(`   Phone:     http://${localIP}:${PORT}`);
  console.log(`\n   To access on your phone, make sure you're on the same WiFi\n`);
});
