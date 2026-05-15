const fs = require('fs');
fs.writeFileSync('start.bat', '@echo off\r\ncd /d "%~dp0"\r\ntitle SOS Dashboard Server\r\nnode server.js\r\npause\r\n', 'ascii');
