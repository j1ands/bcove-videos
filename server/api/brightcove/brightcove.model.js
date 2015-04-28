'use strict';

var mongoose = require('mongoose-bird')();
var Schema = mongoose.Schema;
var http = require('http');

var BrightcoveSchema = new Schema({
  name: String,
  info: String,
  active: Boolean
});

BrightcoveSchema.statics.getAllVideos = function(cb, pageNum) {

	var path = '/services/library?command=search_videos&video_fields=name%2Crenditions%2CFLVURL&get_item_count=true&token=' + process.env.BCOVE_API_KEY;
	path = path + '&page_number=' + pageNum;
	var options = {
		hostname: 'api.brightcove.com',
		path: path,
		method: 'GET'
	}

	var getReq = http.request(options, function (res) {
		      console.log("RES: ", res);	
		      var response = "";
		      res.setEncoding('utf8');
		      res.on('data', function (chunk) { response += chunk; });
		      res.on('end', function () { cb(JSON.parse(response)); });
		      res.on('error', function (err) {
		        cb({ status:'ERROR', statusInfo: err });
		      });
		    });

	getReq.end();
};



module.exports = mongoose.model('Brightcove', BrightcoveSchema);
