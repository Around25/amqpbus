describe("PubSubPattern", function() {
  var AmqpBus = require("../../../");
  var config = {
    amqp: 'amqp://' + (process.env.RABBITMQ_PORT_5672_TCP_ADDR || 'localhost:5672')
  };
  var bus = new AmqpBus(config.amqp);
  var publish = bus.getStream('PUB', 'test.pubsub');
  var subscribe = bus.getStream('SUB', 'test.pubsub', {prefetch: 1});

  describe('single message', function () {

    it('should be able to send and receive one message', function (done) {
      subscribe.receive(function (event, next){
        expect(event).toBeTruthy();
        next();
        done();
      }).then(function (){
        publish.send({valid: true});
      });
    });

  });

});
