const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const connectionHandler = require('./server/handler');

const config = {
  port: 4000,
}

app.use('/public', express.static('./dist'));
app.get('/', function(req, res){
  res.redirect('/public/index.html');
});

io.on('connection', socket=>{
  connectionHandler(io, socket);
});

server.listen(config.port, () => {
  console.log(`Ticket2Ride game running on port ${config.port}`);
});
