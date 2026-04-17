const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3333;
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath.endsWith('/')) urlPath += 'index.html';
  const filePath = path.join(__dirname, urlPath);
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
