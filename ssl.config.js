const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const certDir = path.join(__dirname, 'ssl');
const keyPath = path.join(certDir, 'key.pem');
const certPath = path.join(certDir, 'cert.pem');

if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir);
}

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.log('Generating SSL certificate...');
  execSync(`openssl req -x509 -newkey rsa:4096 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/CN=localhost"`);
  console.log('SSL certificate generated successfully!');
}

module.exports = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
}; 