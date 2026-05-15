console.log('SERVER START');
const http = require('http');
const server = http.createServer((req, res) => {
    res.end('OK');
});
server.listen(3002, () => {
    console.log('LISTENING ON 3002');
});
