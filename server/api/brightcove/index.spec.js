'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var brightcoveCtrlStub = {
  index: 'brightcoveCtrl.index',
  show: 'brightcoveCtrl.show',
  create: 'brightcoveCtrl.create',
  update: 'brightcoveCtrl.update',
  destroy: 'brightcoveCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var brightcoveIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './brightcove.controller': brightcoveCtrlStub
});

describe('Brightcove API Router:', function() {

  it('should return an express router instance', function() {
    brightcoveIndex.should.equal(routerStub);
  });

  describe('GET /api/brightcove', function() {

    it('should route to brightcove.controller.index', function() {
      routerStub.get
                .withArgs('/', 'brightcoveCtrl.index')
                .should.have.been.calledOnce;
    });

  });

  describe('GET /api/brightcove/:id', function() {

    it('should route to brightcove.controller.show', function() {
      routerStub.get
                .withArgs('/:id', 'brightcoveCtrl.show')
                .should.have.been.calledOnce;
    });

  });

  describe('POST /api/brightcove', function() {

    it('should route to brightcove.controller.create', function() {
      routerStub.post
                .withArgs('/', 'brightcoveCtrl.create')
                .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/brightcove/:id', function() {

    it('should route to brightcove.controller.update', function() {
      routerStub.put
                .withArgs('/:id', 'brightcoveCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/brightcove/:id', function() {

    it('should route to brightcove.controller.update', function() {
      routerStub.patch
                .withArgs('/:id', 'brightcoveCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/brightcove/:id', function() {

    it('should route to brightcove.controller.destroy', function() {
      routerStub.delete
                .withArgs('/:id', 'brightcoveCtrl.destroy')
                .should.have.been.calledOnce;
    });

  });

});
