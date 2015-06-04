var EventStream = require('./event-stream');
var inherits = require('util').inherits;

/**
 * Publisher class to handle sending a message to multiple clients, based on a destination
 * @param channel
 * @param options Can have the following options: prefetch, expiration, persistent, topic, task
 * @constructor
 */
function Publish(channel, options) {
  EventStream.call(this, channel, options);
  this.destination = null;
}
inherits(Publish, EventStream);

/**
 * Connect the event stream to the destination
 * @param destination
 * @param callback
 * @returns {Promise|*}
 */
Publish.prototype.connect = function (destination, callback) {
  var self = this,
      exchangeOptions = {durable: false, autoDelete: false};
  this.destination = destination;

  return this.channel.then(function (channel) {
    channel.assertExchange(destination, self.options.routing || 'fanout', exchangeOptions)
      .then(callback);
  });
};

/**
 * Publish a message to a specific topic to all clients that listen for the topic
 * @param topic
 * @param message
 * @param encoding
 * @returns {Promise|*}
 */
Publish.prototype.publish = function (topic, message, encoding) {
  if (!topic) topic = this.options.topic || '';
  var self = this;
  var options = {
    expiration: this.options.expiration,
    persistent: this.options.persistent
  };
  return this.channel.then(function (channel) {
    return channel.publish(self.destination, topic, new Buffer(JSON.stringify(message), encoding), options);
  });
};

/**
 * Trigger a message event on the event stream
 * @param message
 * @param encoding
 * @returns {Promise|*|*}
 */
Publish.prototype.send = function (message, encoding) {
  return this.publish(false, message, encoding);
};

module.exports = Publish;