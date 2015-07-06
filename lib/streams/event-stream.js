var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var Event = require('./event');
var extend = require('util')._extend;

/**
 * Bind event emitter on the object
 *
 * @param obj
 * @param event
 */
function bindEvent(obj, event) {
  return obj.emit.bind(obj, event);
}

/**
 * Base event stream class
 *
 * @param channel AMQP channel
 * @param options
 * @constructor
 */
function EventStream(channel, options) {
  // call parent class constructor
  EventEmitter.call(this);
  var self = this;
  // set amqp channel
  this.channel = channel;
  // set event stream options
  this.options = {
    // library options
    encoding: 'utf8',
    // channel options
    prefetch: false,
    // exchange/queue options
    exchange: '',
    exclusive: false,
    durable: false,
    autoDelete: false,
    // message options
    persistent: false,
    expiration: undefined,
    noAck: true
  };
  extend(this.options, options);
  // by default generate a new queue
  this.queue = '';
  this.exchange = this.options.exchange;
  // set channel options
  function setChannelOptions(ch) {
    ch.on('close', bindEvent(self, 'close'));
    ch.on('error', bindEvent(self, 'error'));
    if (self.options.prefetch !== false) {
      ch.prefetch(options.prefetch);
    }
    // @todo set options of the channel
    return ch;
  }

  channel.then(setChannelOptions, bindEvent(self, 'error'));
}
inherits(EventStream, EventEmitter);


/**
 * Create a new queue
 *
 * @param name
 * @param options
 * @param callback
 */
EventStream.prototype.createQueue = function (name, options, callback) {
  return this.channel.then(function (channel) {
    return channel.assertQueue(name, options)
      .then(function (queue){
        return callback(queue, channel);
      })
      .then(function () {
        return channel;
      });
  });
};

/**
 * Convert a AMQP message to an Event class
 *
 * @param msg
 * @returns {*}
 */
EventStream.convertToEvent = function (msg) {
  if (msg instanceof Event) {
    return msg;
  }
  return new Event(msg.fields.routingKey, JSON.parse(msg.content.toString()), {
    properties: msg.properties,
    fields: msg.fields,
    amqpMsg: msg
  });
};

/**
 * Acknowledge the message in one way or another.
 * Either reject and dispose of the message, reject and requeue the message or confirm message as processed.
 *
 * @param msg
 * @param action
 */
EventStream.prototype.ack = function (msg, action) {
  this.channel.then(function (channel) {
    switch (action) {
      case 'discard':
        channel.reject(msg, false);
        break;
      case 'requeue':
        channel.reject(msg);
        break;
      default:
        channel.ack(msg);
    }
  });
};

/**
 * Generate an acknowledgement handle for the current message
 *
 * @param msg
 * @returns {Function}
 */
EventStream.prototype.getAckHandle = function (msg) {
  var self = this;
  return function (action) {
    self.ack(msg, action);
  };
};

module.exports = EventStream;