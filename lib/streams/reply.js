var EventStream = require('./event-stream');
var inherits = require('util').inherits;

/**
 * Reply constructor
 * - handle responses to any message with a correlation id and a reply queue
 *
 * @param channel
 * @param options
 * @constructor
 */
function Reply(channel, options) {
  EventStream.call(this, channel, options);
}
inherits(Reply, EventStream);

/**
 * Connect the event stream to the destination and listen for messages from the queue.
 * Once a new message is received emit a "message" event with a reply callback that can
 * be called once the message was processed in order to return a message back to the sender
 * @param queue
 * @param callback
 */
Reply.prototype.connect = function (queue, callback) {
  this.queue = queue;
  var queueOptions = {durable: this.options.persistent},
    consumeOptions = {noAck: false},
    self = this;
  queueOptions.durable = false;
  this.createQueue(queue, queueOptions, function (ok, channel) {
    // consume messages from the queue
    channel.consume(queue, function (msg) {
      var event = EventStream.convertToEvent(msg);
      // emit a new message event for each message received
      self.emit('message', event, function (replyMsg, encoding) {
        // when the reply callback is called acknowledge the message received send the response back
        channel.ack(event.options.amqpMsg);
        var options = {
          deliveryMode: false,
          expiration: self.options.expiration,
          correlationId: msg.properties.correlationId
        };
        var replyTo = event.options.properties.replyTo;
        return channel.publish(self.options.exchange, replyTo, new Buffer(JSON.stringify(replyMsg), encoding), options);
      });
    }, consumeOptions);
  })
    .then(callback);
};

module.exports = Reply;