var EventStream = require('./event-stream');
var inherits = require('util').inherits;

/**
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

  this.channel.then(function (channel) {
    channel
      .assertQueue(queue, queueOptions)
      .then(function (ok) {
        // consume messages from the queue
        channel.consume(queue, function (msg) {
          // emit a new message event for each message received
          self.emit('message', msg, function (replyMsg, encoding){
            // when the reply callback is called acknowledge the message received send the response back
            channel.ack(msg);
            var options = {
              deliveryMode: true,
              expiration: self.options.expiration,
              correlationId: msg.properties.correlationId
            };
            return channel.sendToQueue(msg.properties.replyTo, new Buffer(JSON.stringify(replyMsg), encoding), options);
          });
        }, consumeOptions);
      }).then(callback);
  });
};

module.exports = Reply;