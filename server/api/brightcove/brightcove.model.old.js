'use strict';

var mongoose = require('mongoose-bird')();
var Schema = mongoose.Schema;
var http = require('http');
var fs = require('fs');
var async = require('async');

var BrightcoveSchema = new Schema({
  name: String,
  info: String,
  active: Boolean
});

BrightcoveSchema.statics.getAllVideos = function(cb, pageNum) {

	var path = '/services/library?command=search_videos&video_fields=name%2Crenditions%2CFLVURL%2CHDSRenditions%2CWVMRenditions%2CsmoothRenditions%2CvideoFullLength&get_item_count=true&token=' + process.env.BCOVE_API_KEY;
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
//      if(videos.items && videos.items.length > 0){
//	      videos.items.forEach(function(video, index){
		      // console.log("THE VIDEO: " + video.renditions.length);

//		      var url = "";
//		      var number = 0;

	videoLoop(0, 0, videos.items, cb);

	//	      if(video.renditions.length > 0) {
	//		      var renditions = video.renditions;
	//		      renditions.sort(renditionSort);

	//		      async.timesSeries(renditions.length, function(n, next){
	//			      console.log("RENDITION #: " + n);
	//			      var fileName = renditions[n].url;
	//			      fileName = fileName.substring(fileName.lastIndexOf("/")+1);
	//			      var writeStream = fs.createWriteStream(fileName);
	//			      http.get(renditions[n].url, function(res){
	//				      res.pipe(writeStream);
	//				      writeStream.on('end', function(){
	//					      console.log("finished stream #: " + index);
	//					      next("done", null);
	//				      });
//	//				      next("done", null);
	//			      }).on("error", function(e){
	//				      console.log("Got error: " + e.message);
	//				      next(null, e.message);
	//			      });
	//		      }, function(err, res){
	//			      if(err == null){
	//				      console.log("rendition length = " + renditions.length);
	//				      console.log("res length = " + res.length);
	//				      console.log("ALL RENDITIONS INVALID");
	//			      }
	//			      if(index == videos.items.length - 1){
	//				      cb(null, {message: videos.items.length + " videos scrubbed"});
	//			      }
	//		      });

	//	      } else{
	//		      var fileName = video.FLVURL;
	//		      fileName = fileName.substring(fileName.lastIndexOf("/")+1);
	//		      var writeStream = fs.createWriteStream(fileName);
	//		      http.get(video.FLVURL, function(res){
	//			      res.pipe(writeStream);
	//		      });
	//	      }

//		      fs.appendFile('videos7.txt', video.name + " -break- " + url +"\n\n", function(err){
//			      if(err){ throw err };
			      // console.log(url + " appended to file!");
//			      if(index == videos.items.length - 1){
//				      cb(null, {message: videos.items.length + " videos scrubbed"}); 
//			      }
//		      });
};
	
function renditionSort(a, b){
	if(a.size > b.size){
		return -1;
	} else if(a.size < b.size){
		return 1;
	} return 0;
}

function httpLoop(n, renditions, type, vidNum, cb){
	if(n < renditions.length){
	      console.log("RENDITION #: " + n);
	      console.log(renditions.length);
	      var fileName = renditions[n].url;
	      fileName = fileName.substring(fileName.lastIndexOf("/")+1);
	      var writeStream = fs.createWriteStream(fileName);
	      http.get(renditions[n].url, function(res){
		      res.pipe(writeStream);
		      console.log("stream started");
		      writeStream.on('finish', function(){
			      if(writeStream.bytesWritten == 269){
				      httpLoop(n+1, renditions, type, vidNum, cb);
			      } else {
				      cb(vidNum+1, 0);
			      }
		      });
	      }).on("error", function(e){
		      console.log("Got error: " + e.message);
		      httpLoop(n+1, renditions, type, vidNum, cb);
	      });
	} else {
		console.log("error somehow or all out of renditions");
//		flvDown(flv, videoFull, cb);
		cb(vidNum, type+1);
	}
}
//WVMRenditions
//smoothRenditions
//HDSRenditions

var typeRendition = 	{
				0: "renditions",
				1: "WVMRenditions",
				2: "smoothRenditions",
				3: "HDSRenditions"
			};

function videoLoop(n, type, videos, cb){
	if(n < videos.length){
		if(type < 3) {
			console.dir(videos[n]);
			console.log("looping through: " + typeRendition[type]);
			if(videos[n][typeRendition[type]].length > 0) {
				var renditions = videos[n][typeRendition[type]];
				renditions.sort(renditionSort);
				httpLoop(0, renditions, type, n, function(vidNum, typeNum){
					videoLoop(vidNum, typeNum, videos, cb);
				});
			} else {
				videoLoop(n, type+1, videos, cb);
			}
//		      var fileName = videos[n].FLVURL;
//		      fileName = fileName.substring(fileName.lastIndexOf("/")+1);
//		      var writeStream = fs.createWriteStream(fileName);
//		      http.get(videos[n].FLVURL, function(res){
//			      res.pipe(writeStream);
//			      writeStream.on('end', function(){
//				      videoLoop(n+1, videos, cb);
//			      });
//		      });
		} else {
			flvDown(1, videos[n].videoFullLength.url, videos[n].FLVURL, function(){
				videoLoop(n+1, 0, videos, cb);
			});
		}

	} else {
	      cb(null, {message: videos.length + " videos scrubbed"}); 
	}
}

function flvDown(run, full, flv, cb){
	if(run < 3) {
		console.log("attempting: " + arguments[arguments[0]]);
		var fileName = arguments[arguments[0]]; 
		fileName = fileName.substring(fileName.lastIndexOf("/")+1);
		var writeStreamF = fs.createWriteStream(fileName);
		http.get(arguments[arguments[0]], function(res){
			res.pipe(writeStreamF);
			console.log("Starting flv down");
			writeStreamF.on('finish', function(){
				console.dir(writeStreamF);
				if(writeStreamF.bytesWritten == 269){
					flvDown(run+1, full, flv, cb);
				} else {
					cb();
				}
			});
		});

	} else {
		cb();
	}	
}

module.exports = mongoose.model('Brightcove', BrightcoveSchema);
