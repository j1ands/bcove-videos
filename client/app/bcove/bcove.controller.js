'use strict';

angular.module('retrievalApp')
  .controller('BcoveCtrl', function ($scope, videos) {
    $scope.message = 'Hello';
    $scope.videos = [];

//	$scope.videos = videos.get({ pagenum: 408 }, function() {
//		console.log($scope.videos);
//	});

	function grabAllVideos(pageNum) {
		videos.get({ pagenum: pageNum })
	  	      .$promise.then(function(videos) {
			      if(videos.items.length > 0){
			      	      $scope.videos[pageNum] = videos;
				      grabAllVideos(pageNum+1);
			      } else {
				      console.log($scope.videos);
			      }
		      });
	}

//	grabAllVideos(400);
	
  });
