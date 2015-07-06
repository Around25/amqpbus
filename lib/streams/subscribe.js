var EventStream = require('./event-stream');
var inherits = require('util').inherits;

/**
 *
 * @param channel
 * @param options
 * @constructor
 */
function Subscriber(channel, options) {
  EventStream.call(this, channel, options);
  var self = this;
  var queueOptions = {exclusive: true, autoDelete: true};
  var consumeOptions = {noAck: true, exclusive: true};
  this.createQueue('', queueOptions, function (ok, ch) {
    self.queue = ok.queue;
    return ch.consume(ok.queue, function (msg) {
      self.emit('message', msg, function () {
      });
    }, consumeOptions);
  });
}
inherits(Subscriber, EventStream);

Subscriber.prototype.connect = function (source, topic, callback) {
  // Support the general form of connect
  topic = topic || '';
  if (callback === undefined && typeof topic === 'function') {
    callback = topic;
    topic = '';
  }

  var queue = this.queue,
    exchangeOptions = {durable: false, autoDelete: false},
    self = this;
  this.channel.then(function (channel) {
    channel.assertExchange(source, self.options.routing || 'fanout', exchangeOptions)
      .then(function (ok) {
        return channel.bindQueue(queue, source, topic);
      })
      .then(callback);
  });
};

module.exports = Subscriber;