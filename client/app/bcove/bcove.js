'use strict';

angular.module('retrievalApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('bcove', {
        url: '/bcove',
        templateUrl: 'app/bcove/bcove.html',
        controller: 'BcoveCtrl'
      });
  });