var Event = require('./event');
var EventStream = require('./event-stream');
var inherits = require('util').inherits;

/**
 * Push class to handle sending a message to a specific event stream
 * @param channel
 * @param options Can have the following options: prefetch, expiration, persistent
 * @constructor
 */
function Push(channel, options) {
  EventStream.call(this, channel, options);
}
inherits(Push, EventStream);

/**
 * Connect the event stream to the destination
 * @param destination
 * @param callback
 * @returns {Promise|*}
 */
Push.prototype.connect = function (destination, callback) {
  var queueOptions = {durable: this.options.persistent};
  this.queue = destination;

  return this.channel.then(function (channel) {
    channel
      .assertQueue(destination, queueOptions)
      .then(function (ok) {
        callback(ok);
      });
  });
};

/**
 * Send a new message down the event stream
 * @param event
 * @returns {Promise|*}
 */
Push.prototype.send = function (event) {
  var self = this;
  var options, encoding;
  if (event instanceof Event) {
    topic = event.getName() || this.options.topic || '';
    message = event.getMessage();
    var options = {
      expiration: event.options.expiration || this.options.expiration,
      persistent: event.options.persistent || this.options.persistent
    };
  }
  encoding = this.options.encoding;
  return this.channel.then(function (channel) {
    return channel.sendToQueue(self.queue, new Buffer(JSON.stringify(message), encoding), options);
  });
};

module.exports = Push;