'use strict';

var fs = require('fs');

fs.readFile('102videos.txt', 'utf-8', function(err, data){
	if(err) { throw err; }
	var arrLines = data.split('\n');
	for(var i = 0; i < arrLines.length; i++) {
		var split = arrLines[i].split('-break-');
		fs.appendFileSync('names.txt', split[0] + '\n');
		fs.appendFileSync('urls.txt', split[1] + '\n');
	};
});
