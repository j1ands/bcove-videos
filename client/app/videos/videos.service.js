'use strict';

angular.module('retrievalApp')
  .factory('videos', function ($resource) {
	  return $resource('/api/brightcove/:pagenum');
  });
