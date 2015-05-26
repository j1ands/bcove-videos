'use strict';

var mongoose = require('mongoose-bird')();
var Schema = mongoose.Schema;
var http = require('http');
var fs = require('fs');
var async = require('async');
var rtmp = require('rtmp-download');

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
	if(!videos.items) {
        console.dir(videos);
		cb({status:'Video error’, statusInfo: ‘error' }); 
	} else {
        console.log("videos returned!");
        videoLoop(0, 0, videos.items, cb);
	}

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
          console.log("http");
          console.log("n is : " + n);
          console.log("length is: " + renditions.length);
	      var fileName = renditions[n].url;
          if(fileName.indexOf("rtmp") > -1) {
//               fileName = fileName.substring(fileName.lastIndexOf("/")+1);
//               fileName = fileName.substring(0,fileName.indexOf("&"));
//               var config = {
//                   src: renditions[n].url,
//                   target: fileName,
//                   onExit: function(data) {
//                        console.log("RTMP EXIT");
//                       if(data.kbLoaded < 1){
//                           httpLoop(n+1, renditions, type, vidNum, cb);
//                       } else {
//                           cb(vidNum+1, 0);
//                       }
//                   }, 
//                   onError: function(error) {
//                       console.log("RTMP ERROR");
//                       httpLoop(n+1, renditions, type, vidNum, cb);
//                   }
//               }
//               rtmp.download(config);
              fs.appendFileSync('rtmpFiles.txt', renditions[n].url + '\n');
              httpLoop(n+1, renditions, type, vidNum, cb);
          } else {
              fileName = fileName.substring(fileName.lastIndexOf("/")+1);
              var questionPosition = fileName.indexOf("?");
              if(questionPosition > -1) {
                  fileName = fileName.substring(0,questionPosition);
              }   
              var writeStream = fs.createWriteStream(fileName);
              http.get(renditions[n].url, function(res){
                  console.log(fileName);
                  res.pipe(writeStream);
                  writeStream.on('finish', function(){
                      console.log("finished");
                      if(writeStream.bytesWritten < 300){
                          httpLoop(n+1, renditions, type, vidNum, cb);
                      } else {
                          cb(vidNum+1, 0);
                      }
                  });
              }).on("error", function(e){
                  console.log("error");
                  httpLoop(n+1, renditions, type, vidNum, cb);
              });
          }
	} else {
		cb(vidNum, type+1);
	}
}

var typeRendition = 	{
				0: "renditions",
				1: "WVMRenditions",
				2: "smoothRenditions",
				3: "HDSRenditions"
			};

function videoLoop(n, type, videos, cb){
    console.log("video");
    console.log("n is: " + n);
    console.log("length is: " + videos.length);
	if(n < videos.length - 1){
		if(type < 3) {
			if(videos[n][typeRendition[type]].length > 0) {
				var renditions = videos[n][typeRendition[type]];
				renditions.sort(renditionSort);
				httpLoop(0, renditions, type, n, function(vidNum, typeNum){
					videoLoop(vidNum, typeNum, videos, cb);
				});
			} else {
				videoLoop(n, type+1, videos, cb);
			}

		} else {
            var fullLength = videos[n].videoFullLength ? videos[n].videoFullLength.url : null;
			flvDown(1, fullLength, videos[n].FLVURL, function(){
				videoLoop(n+1, 0, videos, cb);
			});
		}

	} else {
          // console.log("callback about to be returned");
	      cb(null, {message: videos.length + " videos scrubbed"}); 
	}
}

function flvDown(run, full, flv, cb){
	if(run < 3) {
		var fileName = arguments[arguments[0]]; 
        if(fileName){
            if(fileName.indexOf("rtmp") > -1) {
//               fileName = fileName.substring(fileName.lastIndexOf("/")+1);
//               fileName = fileName.substring(0,fileName.indexOf("&"));
//               var config = {
//                   src: arguments[arguments[0]],
//                   target: fileName,
//                   onExit: function(data) {
//                       console.log("RTMP EXIT");
//                       if(data.kbLoaded < 1){
//                            flvDown(run+1, full, flv, cb);
//                       } else {
//                            cb();
//                       }
//                   },
//                   onError: function(error) {
//                       console.log("RTMP ERROR");
//                       flvDown(run+1, full, flv, cb);
//                   }
//               }
//               rtmp.download(config);
                fs.appendFileSync('rtmpFiles.txt', arguments[arguments[0]] + '\n');
                flvDown(run+1, full, flv, cb);
            } else {     
                fileName = fileName.substring(fileName.lastIndexOf("/")+1);
                var writeStreamF = fs.createWriteStream(fileName);
                http.get(arguments[arguments[0]], function(res){
                    res.pipe(writeStreamF);
                    writeStreamF.on('finish', function(){
                        if(writeStreamF.bytesWritten < 300){
                            flvDown(run+1, full, flv, cb);
                        } else {
                            cb();
                        }
                    });
                });
            }
        } else {
            flvDown(run+1, full, flv, cb);
        }
	} else {
		cb();
	}	
}

module.exports = mongoose.model('Brightcove', BrightcoveSchema);
