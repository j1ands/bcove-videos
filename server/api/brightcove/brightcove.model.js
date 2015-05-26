'use strict';

var mongoose = require('mongoose-bird')();
var Schema = mongoose.Schema;
var http = require('http');
var fs = require('fs');
var async = require('async');
var rtmp = require('rtmp-download');
var request = require('request');

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
var streamError = false;
var flvStreamError = false;
	
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
                  httpLoop(n+1, renditions, vidNum, cb);
              } else {
                  fileName = fileName.substring(fileName.lastIndexOf("/")+1);
                  var questionPosition = fileName.indexOf("?");
                  if(questionPosition > -1) {
                      fileName = fileName.substring(0,questionPosition);
                  }   
                  var writeStream = fs.createWriteStream("./videos/" + fileName);
                  var url = renditions[n].url;
                  url = url.replace("http://cinesporthds-vh.akamaihd.net/z/", "http://cinesporthds.brightcove.com.edgesuite.net/");
                  url = url.replace("http://brightcove06-f.akamaihd.net/", "http://brightcove05.brightcove.com/");
                  
                  
                  var readStream = request(url);
                  
                  console.log(fileName, url);
                  
                  var prevSize = 0;
                  var counter = 0;
                  
                  var fileCheck = setInterval(function(){

                      var currSize = writeStream.bytesWritten;
                      if(currSize == prevSize) {
                          if(counter > 0) {
                              streamError = true;
                              writeStream.end();
                          } else {
                              counter++;
                          }
                      } else {
                          counter = 0;
                      }

                      prevSize = currSize;

                  }, 5000);
                  
                  readStream.pipe(writeStream);
                  
                  writeStream.on('finish', function() {
                      clearInterval(fileCheck);
                      console.log("finished");
                      if(writeStream.bytesWritten < 300 || streamError){
                          fs.appendFileSync('errorvideos.txt', url + '\n');
                          console.log("failed download #: " + fail++);
                          console.log(url);
                          streamError = false;
                          httpLoop(n+1, renditions, vidNum, cb);
                      } else {
                          console.log("successful download #: " + success++);
                          cb(vidNum+1);
                      }
                  });
                  
                  readStream.on('error', function(err) {
                      clearInterval(fileCheck);
                      writeStream.close();
                      console.log("error");
                      fs.appendFileSync('errorvideos.txt', url + '\n');
                      httpLoop(n+1, renditions, vidNum, cb);
                  });
                  

              }
          } else {
              httpLoop(n+1, renditions, vidNum, cb);
          }   
	} else {
		cb();
	}
}


function videoLoop(n, videos, cb){
	if(n < videos.length - 1){
			if(videos[n].renditions.length > 0) {
				var renditions = videos[n].renditions;
				renditions.sort(renditionSort);
                // console.log("Rendition #0: " + renditions[0].url + " and size: " + renditions[0].size);
                // console.log("Rendition #1: " + renditions[1].url + " and size: " + renditions[1].size);               
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
                var questionPosition = fileName.indexOf("?");
                if(questionPosition > -1) {
                    fileName = fileName.substring(0,questionPosition);
                } 
                var writeStreamF = fs.createWriteStream("./videos/" + fileName);
                var url = arguments[arguments[0]];
                url = url.replace("http://cinesporthds-vh.akamaihd.net/z/", "http://cinesporthds.brightcove.com.edgesuite.net/");
                url = url.replace("http://brightcove06-f.akamaihd.net/", "http://brightcove05.brightcove.com/");      
                
                  var readStream = request(url);
                  
                  console.log(fileName, url);
                  
                  var prevSize = 0;
                  var counter = 0;
                  
                  var fileCheck = setInterval(function(){

                      var currSize = writeStreamF.bytesWritten;
                      if(currSize == prevSize) {
                          if(counter > 0) {
                              flvStreamError = true;
                              writeStreamF.end();
                          } else {
                              counter++;
                          }
                      } else {
                          counter = 0;
                      }

                      prevSize = currSize;

                  }, 5000);
                  
                  readStream.pipe(writeStreamF);
                  
                  writeStreamF.on('finish', function() {
                      clearInterval(fileCheck);
                      console.log("finished");
                      if(writeStreamF.bytesWritten < 300 || flvStreamError){
                          fs.appendFileSync('errorvideos.txt', url + '\n');
                          console.log("failed download #: " + fail++);
                          console.log(url);
                          flvStreamError = false;
                          flvDown(run+1, full, flv, cb);
                      } else {
                          console.log("successful download #: " + success++);
                          cb();
                      }
                  });
                  
                  readStream.on('error', function(err) {
                      clearInterval(fileCheck);
                      writeStreamF.close();
                      console.log("error");
                      fs.appendFileSync('errorvideos.txt', url + '\n');
                      flvDown(run+1, full, flv, cb);
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
