var spheron = require('spheron');
var sphero = spheron.sphero();
var spheroPort = process.env.SPHERO || '/dev/cu.Sphero-RGB';
var COLORS = spheron.toolbelt.COLORS;

sphero.on('open', function() {
  sphero.setRGB(COLORS.BLUE, false).strobeLED({period:60});
});

sphero.open(spheroPort);