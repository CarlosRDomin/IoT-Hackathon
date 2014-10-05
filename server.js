//For Server
var http = require('http'),
ioServer = require('socket.io'),
ip = process.env.IP || 'localhost'
portToListen = 8081;

// For client
var ioClient = require('socket.io-client'),
server_url = 'http://' + ip + ':' + portToListen;


// Create server & socket
var server = http.createServer(function(req, res)
{
  // Send HTML headers and message
  res.writeHead(404, {'Content-Type': 'text/html'});
  res.end('<h1>Aw, snap! 404</h1>');
});
server.listen(portToListen);
ioServer = ioServer.listen(server);

// listen to incoming request
ioServer.sockets.on('connection', function(socket)
{
  console.log('Client connected.');
  socket.on("message", function(data){
  	console.log(data);
  });
  // Disconnect listener
  socket.on('disconnect', function() {
  	console.log('Client disconnected.');
  });
});

// Client
var ioClient = require('socket.io-client');
var socket_client = ioClient.connect(server_url, {reconnect: true});

// send messages
socket_client.on('connect', function() { 
  console.log('Connected!');
  socket_client.emit("message", "data sent");
  socket_client.emit("message", "data sent2");
  socket_client.emit("message", "data sent3");
});

