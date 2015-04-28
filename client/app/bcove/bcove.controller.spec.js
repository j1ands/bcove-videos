'use strict';

describe('Controller: BcoveCtrl', function () {

  // load the controller's module
  beforeEach(module('retrievalApp'));

  var BcoveCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    BcoveCtrl = $controller('BcoveCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
