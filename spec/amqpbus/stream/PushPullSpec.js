describe("PushPullPattern", function() {
  var AmqpBus = require("../../../");

  var config = {
    amqp: 'amqp://' + (process.env.RABBITMQ_PORT_5672_TCP_ADDR || 'localhost:5672')
  };
  var bus = new AmqpBus(config.amqp);
  var push = bus.getStream('PUSH', 'test.pushpull');
  var pull = bus.getStream('PULL', 'test.pushpull', {prefetch: 1});

  describe('single message', function () {

    it('should be able to send and receive one message', function (done) {
      pull.receive(function (event){
        expect(event).toBeTruthy();
        done();
      });
      push.send({valid: true});
    });

    it('should be able to send and receive an event', function (done) {
      pull.receive(function (event){
        expect(event).toBeTruthy();
        done();
      });
      var event = new AmqpBus.Event('', {valid: true});
      push.send(event);
    });

  });

});
