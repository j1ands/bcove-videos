'use strict';

angular.module('retrievalApp')
  .controller('BcoveCtrl', function ($scope, videos, $timeout) {
    $scope.videos = {message: ""};
    var counter = 0;

	function grabAllVideos(pageNum) {
		videos.get({ pagenum: pageNum })
	  	      .$promise.then(function(message){
			      if(pageNum < 350){
				      counter = 0;
				      $scope.videos.message += message.message + "\n";
			      	      grabAllVideos(pageNum+1);
			      } else {
				      console.log("batch complete");
			      }
		      }, function(fail){
				if(counter > 3){
				      $scope.videos.message += "TIMEOUT STARTED\n";
				      $timeout(function(){
					      grabAllVideos(pageNum);
				      }, 30000);
			        } else {
			      	      counter++;
			              grabAllVideos(pageNum);
				}
		      });
	}

	grabAllVideos(212);
	
  });
