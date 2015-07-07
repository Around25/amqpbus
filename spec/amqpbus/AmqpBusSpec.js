describe("AmqpBus", function () {
  var AmqpBus = require("../../");

  var Publish = require('../../lib/streams/publish');
  var Subscribe = require('../../lib/streams/subscribe');
  var Push = require('../../lib/streams/push');
  var Pull = require('../../lib/streams/pull');
  var Request = require('../../lib/streams/request');
  var Reply = require('../../lib/streams/reply');

  var config = {
    amqp: 'amqp://' + (process.env.RABBITMQ_PORT_5672_TCP_ADDR || 'localhost:5672')
  };

  describe('__construct', function () {

    it('should trigger an error event for a failed connection', function (done) {
      var bus = new AmqpBus('');
      bus.context.on('error', function (err) {
        expect(err).toBeTruthy();
        done();
      });
      bus.context.on('ready', function (context) {
        expect(context).toBeTruthy();
        done();
      });
    });

    it('should call ready for a successful connection', function (done) {
      var bus = new AmqpBus(config.amqp);
      bus.context.on('error', function (err) {
        expect(!err).toBeTruthy();
        done();
      });
      bus.context.on('ready', function (context) {
        expect(context).toBeTruthy();
        done();
      });
    });

    it('should call ready callback for a successful connection', function (done) {
      var bus = new AmqpBus(config.amqp, function (context) {
        expect(context).toBeTruthy();
        done();
      });
      bus.context.on('error', function (err) {
        expect(!err).toBeTruthy();
        done();
      });
    });

    it('should be able to close a connection', function (done) {
      var bus = new AmqpBus(config.amqp);
      bus.context.on('close', function (){
        done();
      });
      bus.context.on('ready', function (context) {
        bus.context.close();
      });
    });

  });

  describe('getStream("INVALID")', function () {
    it('should return null', function () {
      var bus = new AmqpBus(config.amqp);
      var stream = bus.getStream('INVALID', 'exchange.request');
      expect(stream.stream).toBeFalsy();
    });
  });

  describe('getStream("REQ")', function () {
    it('should return a Request stream type', function () {
      var bus = new AmqpBus(config.amqp);
      var stream = bus.getStream('REQUEST', 'exchange.request');
      expect(stream.stream instanceof Request).toBeTruthy();
    });
  });

  describe('getStream("REP")', function () {
    it('should return a Reply stream type', function () {
      var bus = new AmqpBus(config.amqp);
      var stream = bus.getStream('REPLY', 'exchange.reply');
      expect(stream.stream instanceof Reply).toBeTruthy();
    });
  });

  describe('getStream("PUSH")', function () {
    it('should return a Push stream type', function () {
      var bus = new AmqpBus(config.amqp);
      var stream = bus.getStream('PUSH', 'exchange.push');
      expect(stream.stream instanceof Push).toBeTruthy();
    });
  });

  describe('getStream("PULL")', function () {
    it('should return a Pull stream type', function () {
      var bus = new AmqpBus(config.amqp);
      var stream = bus.getStream('PULL', 'exchange.pull');
      expect(stream.stream instanceof Pull).toBeTruthy();
    });
  });

  describe('getStream("PUB")', function () {
    it('should return a Publish stream type', function () {
      var bus = new AmqpBus(config.amqp);
      var stream = bus.getStream('PUBLISH', 'exchange.publish');
      expect(stream.stream instanceof Publish).toBeTruthy();
    });
  });

  describe('getStream("SUB")', function () {
    it('should return a Subscribe stream type', function () {
      var bus = new AmqpBus(config.amqp);
      var stream = bus.getStream('SUBSCRIBE', 'exchange.subscribe');
      expect(stream.stream instanceof Subscribe).toBeTruthy();
    });
  });

});
