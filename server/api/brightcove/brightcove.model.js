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
        videoLoop(0, videos.items, cb);
	}

};

var success = 0;
var fail = 0;
	
function renditionSort(a, b){
	if(a.size > b.size){
		return -1;
	} else if(a.size < b.size){
		return 1;
	} return 0;
}

function httpLoop(n, renditions, vidNum, cb){
	if(n < renditions.length){
	      var fileName = renditions[n].url;
          if(fileName) {
              if(fileName.indexOf("rtmp") > -1) {
                  fs.appendFileSync('rtmpFiles.txt', renditions[n].url + '\n');
                  httpLoop(n+1, renditions, type, vidNum, cb);
              } else {
                  fileName = fileName.substring(fileName.lastIndexOf("/")+1);
                  var questionPosition = fileName.indexOf("?");
                  if(questionPosition > -1) {
                      fileName = fileName.substring(0,questionPosition);
                  }   
                  var writeStream = fs.createWriteStream(fileName);
                  var url = renditions[n].url;
                  url = url.replace("http://cinesporthds-vh.akamaihd.net/z/", "http://cinesporthds.brightcove.com.edgesuite.net/");
                  http.get(url, function(res){
                      console.log(fileName);
                      res.pipe(writeStream);
                      writeStream.on('finish', function(){
                          console.log("finished");
                          if(writeStream.bytesWritten < 300){
                              console.log("failed download #: " + fail++);
                              console.log(url);
                              httpLoop(n+1, renditions, vidNum, cb);
                          } else {
                              console.log("successful download #: " + success++);
                              cb(vidNum+1);
                          }
                      });
                  }).on("error", function(e){
                      console.log("error");
                      httpLoop(n+1, renditions, type, vidNum, cb);
                  });
              }
          } else {
              httpLoop(n+1, renditions, vidNum, cb);
          }   
	} else {
		cb();
	}
}

var typeRendition = 	{
				0: "renditions",
				1: "WVMRenditions",
				2: "smoothRenditions",
				3: "HDSRenditions"
			};

function videoLoop(n, videos, cb){
	if(n < videos.length - 1){
			if(videos[n].renditions.length > 0) {
				var renditions = videos[n].renditions;
				renditions.sort(renditionSort);
				httpLoop(0, renditions, n, function(vidNum){
                    if(!vidNum){
                        var fullLength = videos[n].videoFullLength ? videos[n].videoFullLength.url : null;
                        flvDown(1, fullLength, videos[n].FLVURL, function(){
                            videoLoop(n+1, videos, cb);
                        });
                    } else {                        
					    videoLoop(vidNum, videos, cb);
                    }
				});
			} else {
                var fullLength = videos[n].videoFullLength ? videos[n].videoFullLength.url : null;
			    flvDown(1, fullLength, videos[n].FLVURL, function(){
				    videoLoop(n+1, videos, cb);
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
                fs.appendFileSync('rtmpFiles.txt', arguments[arguments[0]] + '\n');
                flvDown(run+1, full, flv, cb);
            } else {     
                fileName = fileName.substring(fileName.lastIndexOf("/")+1);
                var writeStreamF = fs.createWriteStream(fileName);
                var url = arguments[arguments[0]];
                url = url.replace("http://cinesporthds-vh.akamaihd.net/z/", "http://cinesporthds.brightcove.com.edgesuite.net/");
                http.get(url, function(res){
                    res.pipe(writeStreamF);
                    writeStreamF.on('finish', function(){
                        if(writeStreamF.bytesWritten < 300){
                            console.log("failed download #: " + fail++);
                            console.log(url);
                            flvDown(run+1, full, flv, cb);
                        } else {
                            console.log("successful download #: " + success++);
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
