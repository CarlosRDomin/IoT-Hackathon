var spheron = require('spheron'),
sphero = spheron.sphero(),
spheroPort = process.env.SPHERO || '/dev/cu.Sphero-RGB',
COLORS = spheron.toolbelt.COLORS,
through = require("through");

var options = {},
rate = 400 / (options.rate || 10), // 10 Hz
stream = through(),
maskAccel = 0x8000 | 0x4000 | 0x2000,
maskOdom = 0x8000000 | 0x400000,
mask = maskAccel,
useMask2 = (mask == maskOdom);

// Client connectivity
var http = require('http'),
serverIp = process.env.IP || '10.15.2.115',
serverPort = 8081,
server_url = 'http://' + serverIp + ':' + serverPort,
ioClient = require('socket.io-client');

sphero.on('open', function() {
	clearTimeout(connectTimeout);
	console.log('Connected to the Sphero! :)');
	sphero.setRGB(COLORS.YELLOW, false);
	
	var clientSocket = ioClient.connect(server_url, {reconnect: true});

	clientSocket.on('connect', function() { 
	  console.log('Connected to server!');
	});

	// Turn on accelerometer data streaming
	sphero.setDataStreaming(rate, 1, mask, 0, useMask2);
	sphero.setAccelerometerRange(2);
	
	var posTh = 60, speedTh = 1, timeInterval = 2000/10;
	sphero.configureCollisionDetection(1, posTh, speedTh, posTh, speedTh, timeInterval);

	// Read incoming accelerometer data and emit on stream
	sphero.on("packet", function(packet) {
		if (packet.ID_CODE === 0x03) {
			if (useMask2) {
				stream.queue({
					x: packet.DATA.readInt16BE(0),
					y: packet.DATA.readInt16BE(2),
				});
			} else if (mask == maskAccel) {
				stream.queue({
					x: packet.DATA.readInt16BE(0),
					y: packet.DATA.readInt16BE(2),
					z: packet.DATA.readInt16BE(4),
				});
			} else {
				stream.queue({
					yaw: packet.DATA.readInt16BE(0),
					roll: packet.DATA.readInt16BE(2),
					pitch: packet.DATA.readInt16BE(4),
				});
			}
		} else if (packet.ID_CODE === 0x07) {
			stream.queue({
					x: packet.DATA.readInt16BE(0),
					y: packet.DATA.readInt16BE(2),
					z: packet.DATA.readInt16BE(4),
					axis: packet.DATA.readInt8(6),
					xMag: packet.DATA.readInt16BE(7),
					yMag: packet.DATA.readInt16BE(9),
					speed: packet.DATA.readInt8(11),
					time: packet.DATA.readInt32BE(12),
			});
		} else {
			console.log('Unknown packet received! ', packet);
		}
	});

	stream.on('data', function(data){
		if (data.time) {
			console.log('Collision detected!!!\n\tx: ', data.x, '\ty: ', data.y, '\tz: ', data.z, '\tAxis: ', data.axis, '\n\txMag: ', data.xMag, '\tyMag: ', data.yMag, '\tSpeed: ', data.speed, '\tTime: ', data.time);
			var mag = Math.sqrt(Math.pow(data.xMag,2) + Math.pow(data.yMag,2)),
			ang = require('mathjs').mod(Math.atan2(data.y,data.x)*180/Math.PI, 360);
			console.log('Sending:\n\tMagintude: ', mag, '\tAngle: ', ang);
			clientSocket.emit("impact", mag + "," + ang);
		}else if (useMask2) {
			console.log('Odometer: ', data.x, data.y);
		} else if (mask == maskAccel) {
			console.log('Accel: x: ', data.x, '\ty: ', data.y, '\tz: ', data.z);
		} else {
			console.log('Yaw: ', data.yaw, ';\tRoll: ', data.roll, '\tPitch: ', data.pitch);
		}
	});

	sphero.on('end', function() {
		console.log('Connection has ended');
	});
  
});

sphero.open(spheroPort);
var connectTimeout = setTimeout(function(){
	console.log('Connection to the Sphero timed out :(');
	process.kill();
}, 5000);
console.log('Connecting...');
