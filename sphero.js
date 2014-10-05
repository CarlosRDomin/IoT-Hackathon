var spheron = require('spheron');
var sphero = spheron.sphero();
var spheroPort = process.env.SPHERO || '/dev/cu.Sphero-RGB';
var COLORS = spheron.toolbelt.COLORS;
var through = require("through");


//For Server
var http = require('http'),
ioServer = require('socket.io'),
ip = process.env.IP || 'localhost',
portToListen = 8081;


sphero.on('open', function() {
	sphero.setRGB(COLORS.BLUE, false);


	// Create server & socket
	var server = http.createServer(function(req, res)
	{
		// Send HTML headers and message
		res.writeHead(404, {'Content-Type': 'text/html'});
		res.end('<h1>Aw, snap! 404</h1>');
	});
	server.listen(portToListen);
	ioServer = ioServer.listen(server);

	console.log('Server Listenning!');
	// listen to incoming request
	ioServer.sockets.on('connection', function(socket)
	{
		console.log('Client connected.');
	 
		socket.on("impact", function(data){
			var magnitude = Math.min(Math.max(120, 2*Math.floor(data.split(',')[0])), 250);
			var orientation = Math.floor(data.split(',')[1]);
			var rollLength = Math.min(3000, Math.max(4*magnitude, 10w00));
			
			console.log('Magnitude: ', magnitude, '; Orientation: ', orientation, '; Duration: ', rollLength);
			
			sphero.roll(magnitude, orientation, 1, {});
			setTimeout(function(){
				sphero.roll(0, orientation, 1, {});
			}, rollLength);
		});
	 
		// Disconnect listener
		socket.on('disconnect', function() {
			console.log('Client disconnected.');
		});
	});
	

	sphero.on('end', function() {
		console.log('Connection has ended');
	});
  
});

sphero.open(spheroPort);
