var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

/**
 * Bind event emitter on the object
 * @param obj
 * @param event
 */
function bindEvent(obj, event) {
  return obj.emit.bind(obj, event);
}

/**
 * Base event stream class
 * @param channel
 * @param options
 * @constructor
 */
function EventStream(channel, options) {
  EventEmitter.call(this);
  this.channel = channel;
  this.options = options = options || {};
  this.queue = '';
  var self = this;
  channel
    .then(function (ch) {
      ch.on('close', bindEvent(self, 'close'));
      ch.on('error', bindEvent(self, 'error'));
      if (options.hasOwnProperty('prefetch')) {
        ch.prefetch(options.prefetch);
      }
      // @todo set options of the channel
      return ch;
    })
    .then(null, bindEvent(self, 'error'));
}
inherits(EventStream, EventEmitter);

/**
 * Acknowledge the message in one way or another.
 * Either reject and dispose of the message, reject and requeue the message or confirm message as processed.
 *
 * @param msg
 * @param action
 */
EventStream.prototype.ack = function (msg, action){
  this.channel.then(function (channel){
    switch(action){
      case 'discard':
        channel.reject(msg, false);
        break;
      case 'requeue':
        channel.reject(msg);
        break;
    }
    channel.ack(msg);
  });
};

/**
 * Generate an acknowledgement handle for the current message
 * @param msg
 * @returns {Function}
 */
EventStream.prototype.getAckHandle = function (msg) {
  var self = this;
  return function (action){
    self.ack(msg, action);
  };
};

module.exports = EventStream;