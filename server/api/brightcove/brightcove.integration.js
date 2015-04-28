'use strict';

var app = require('../../app');
var request = require('supertest');

var newBrightcove;

describe('Brightcove API:', function() {

  describe('GET /api/brightcove', function() {
    var brightcoves;

    beforeEach(function(done) {
      request(app)
        .get('/api/brightcove')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          brightcoves = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      brightcoves.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/brightcove', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/brightcove')
        .send({
          name: 'New Brightcove',
          info: 'This is the brand new brightcove!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          newBrightcove = res.body;
          done();
        });
    });

    it('should respond with the newly created brightcove', function() {
      newBrightcove.name.should.equal('New Brightcove');
      newBrightcove.info.should.equal('This is the brand new brightcove!!!');
    });

  });

  describe('GET /api/brightcove/:id', function() {
    var brightcove;

    beforeEach(function(done) {
      request(app)
        .get('/api/brightcove/' + newBrightcove._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          brightcove = res.body;
          done();
        });
    });

    afterEach(function() {
      brightcove = {};
    });

    it('should respond with the requested brightcove', function() {
      brightcove.name.should.equal('New Brightcove');
      brightcove.info.should.equal('This is the brand new brightcove!!!');
    });

  });

  describe('PUT /api/brightcove/:id', function() {
    var updatedBrightcove

    beforeEach(function(done) {
      request(app)
        .put('/api/brightcove/' + newBrightcove._id)
        .send({
          name: 'Updated Brightcove',
          info: 'This is the updated brightcove!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedBrightcove = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedBrightcove = {};
    });

    it('should respond with the updated brightcove', function() {
      updatedBrightcove.name.should.equal('Updated Brightcove');
      updatedBrightcove.info.should.equal('This is the updated brightcove!!!');
    });

  });

  describe('DELETE /api/brightcove/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/brightcove/' + newBrightcove._id)
        .expect(204)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when brightcove does not exsist', function(done) {
      request(app)
        .delete('/api/brightcove/' + newBrightcove._id)
        .expect(404)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

  });

});
