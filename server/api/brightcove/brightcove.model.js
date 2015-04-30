'use strict';

var mongoose = require('mongoose-bird')();
var Schema = mongoose.Schema;
var http = require('http');
var fs = require('fs');

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
//		      console.log("RES: ", res);	
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

BrightcoveSchema.statics.recordUrl = function(videos, cb){
      if(videos.items && videos.items.length > 0){
	      videos.items.forEach(function(video, index){
		      // console.log("THE VIDEO: " + video.renditions.length);

		      var url = "";
		      var number = 0;

		      if(video.renditions.length > 0) {
			      var largest = video.renditions[0];
			      for(var i = 1; i < video.renditions.length; i++){
				      if(video.renditions[i].size > largest.size){
					      largest = video.renditions[i];
					      number = i;
				      }
			      }
			      url = largest.url;
		      } else {
			      url = video.FLVURL;
		      }

		      fs.appendFile('videos7.txt', video.name + " -break- " + url +"\n\n", function(err){
			      if(err){ throw err };
			      // console.log(url + " appended to file!");
			      if(index == videos.items.length - 1){
				      cb(null, {message: videos.items.length + " videos scrubbed"}); 
			      }
		      });
	      });
      } else {
	      console.log("FAILED VIDS: " + videos);
	      cb(videos);
      }
};
	



module.exports = mongoose.model('Brightcove', BrightcoveSchema);
