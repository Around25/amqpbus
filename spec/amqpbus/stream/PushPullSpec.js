describe("PushPullPattern", function() {
  var AmqpBus = require("../../../");

  var config = {
    amqp: 'amqp://' + (process.env.RABBITMQ_PORT_5672_TCP_ADDR || 'localhost:5672')
  };
  var bus = new AmqpBus(config.amqp);

  describe('single message', function () {

    it('should be able to send and receive one message', function (done) {
      var push = bus.getStream('PUSH', 'test.pushpull1');
      var pull = bus.getStream('PULL', 'test.pushpull1', {prefetch: 1});
      pull.receive(function (event, next){
        next();
        expect(event).toBeTruthy();
        done();
      });
      push.send({valid: true});
    });

    it('should be able to send and receive an event', function (done) {
      var push = bus.getStream('PUSH', 'test.pushpull2');
      var pull = bus.getStream('PULL', 'test.pushpull2', {prefetch: 1});
      pull.receive(function (event, next){
        next();
        expect(event).toBeTruthy();
        done();
      });
      var event = new AmqpBus.Event('', {valid: true});
      push.send(event);
    });

    it('should be able to reject an event', function (done) {
      var push = bus.getStream('PUSH', 'test.pushpull3');
      var pull = bus.getStream('PULL', 'test.pushpull3', {prefetch: 1});
      pull.receive(function (event, next){
        pull.ack(event.options.amqpMsg, 'discard');
        expect(event).toBeTruthy();
        done();
      });
      var event = new AmqpBus.Event('', {valid: true});
      push.send(event);
    });

    it('should be able to requeue an event', function (done) {
      var push = bus.getStream('PUSH', 'test.pushpull4');
      var pull = bus.getStream('PULL', 'test.pushpull4', {prefetch: 1});
      pull.receive(function (event, next){
        next('requeue');
        expect(event).toBeTruthy();
        done();
      });
      var event = new AmqpBus.Event('', {valid: true});
      push.send(event);
    });
  });

});
