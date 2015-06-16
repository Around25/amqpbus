var EventStream = require('./event-stream');
var inherits = require('util').inherits;

/**
 * Pull event stream constructor
 * @param channel
 * @param options
 * @constructor
 */
function Pull(channel, options) {
  EventStream.call(this, channel, options);
}
inherits(Pull, EventStream);

/**
 * Connect the event stream to the destination and wait for messages.
 * The event stream emits a message event whenever a new message has been received through the AMQP message bus
 * @param queue
 * @param callback
 */
Pull.prototype.connect = function (queue, callback) {
  this.queue = queue;
  var queueOptions = {durable: this.options.persistent},
    consumeOptions = {noAck: false},
    self = this;

  this.createQueue(queue, queueOptions,function (ok, channel) {
    channel.consume(queue, function (msg) {
      self.emit('message', EventStream.convertToEvent(msg), self.getAckHandle);
    }, consumeOptions);
  }).then(callback);
};

module.exports = Pull;