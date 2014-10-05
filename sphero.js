var spheron = require('spheron');
var sphero = spheron.sphero();
var spheroPort = process.env.SPHERO || '/dev/cu.Sphero-RGB';
var COLORS = spheron.toolbelt.COLORS;
var through = require("through");

// Mask for accelerometer x y z data
var MASK = 0x0000 | 0x0000 | 0x0000;
var MASK2 = 0x08000000 | 0x04000000;

sphero.on('open', function() {
	sphero.setRGB(COLORS.RED, false);

	var stream = through();
	var options = {};
	var rate = 400 / (options.rate || 10); // default 10Hz

	// Turn on accelerometer data streaming
	sphero.setDataStreaming(rate, 1, MASK2, 0, true);

	// Read incoming accelerometer data and emit on stream
	sphero.on("packet", function(packet) {
		if (packet.ID_CODE === 0x03) {
			stream.queue({
				x: packet.DATA.readInt16BE(0),
				y: packet.DATA.readInt16BE(2),
			});
		}
	});


	stream.on('data', function(data){
		console.log('Odometor: ', data.x, data.y);
	});




	sphero.on('end', function() {
		console.log('Connection has ended');
	});

  
});


sphero.open(spheroPort);


