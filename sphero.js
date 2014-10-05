var spheron = require('spheron');
var sphero = spheron.sphero();
var spheroPort = process.env.SPHERO || '/dev/cu.Sphero-RGB';
var COLORS = spheron.toolbelt.COLORS;
var through = require("through");

// Mask for accelerometer x y z data
var maskYawRollPitch = 0x10000 | 0x20000 | 0x40000;	// Yaw, roll, pitch
var maskAccel = 0x8000 | 0x4000 | 0x2000;	// Accel X, Y, Z
var maskOdom = 0x08000000 | 0x04000000; // Odometer X and Y
var maskOdom = 0x01000000 | 0x00800000; // Velocity X and Y
var mask = 0;
var useMask2 = (mask==maskOdom);

sphero.on('open', function() {
	clearTimeout(connectTimeout);
	console.log('Connected! :)');
	sphero.setRGB(COLORS.BLUE, false);

	var stream = through();
	var options = {};
	var rate = 400 / (options.rate || 10); // default 10Hz

	// Turn on accelerometer data streaming
	sphero.setDataStreaming(rate, 1, mask, 0, useMask2);
	//sphero.setAccelerometerRange(2);
	
	var posTh = 20, speedTh = 1, timeInterval = 200/10;
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
		if (mask == 0) {
			console.log('Collision detected!!!\n\tx: ', data.x, '\ty: ', data.y, '\tz: ', data.z, '\tAxis: ', data.axis, '\n\txMag: ', data.xMag, '\tyMag: ', data.yMag, '\tSpeed: ', data.speed, '\tTime: ', data.time);
			console.log('Sending:\n\tMagintude: ', Math.sqrt(Math.pow(data.xMag,2) + Math.pow(data.yMag,2)), '\tAngle: ', require('mathjs').mod(Math.atan2(data.y,data.x)*180/Math.PI, 360));
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
	console.log('Connection timeout :(');
	process.kill();
}, 5000);
console.log('Connecting...');
