describe("RequestReplyPattern", function() {
  var AmqpBus = require("../../../");
  var config = {
    amqp: 'amqp://' + (process.env.RABBITMQ_PORT_5672_TCP_ADDR || 'localhost:5672')
  };
  var bus = new AmqpBus(config.amqp);
  var request = bus.getStream('REQ', 'test.reqrep', {prefetch: 1});
  var reply = bus.getStream('REP', 'test.reqrep', {prefetch: 1});

  describe('single message', function () {

    it('should be able to send and receive one message', function (done) {
      reply.receive(function (event, next){
        expect(event).toBeTruthy();
        expect(event.message.value).toBe(124);
        next({value: 421});
      });
      request.send({value: 124}, function (event){
        expect(event).toBeTruthy();
        expect(event.message.value).toBe(421);
        done();
      });
    });

  });
});
