var amqp = require('amqplib');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var Publish = require('./streams/publish');
var Subscribe = require('./streams/subscribe');
var Push = require('./streams/push');
var Pull = require('./streams/pull');
var Request = require('./streams/request');
var Reply = require('./streams/reply');

/**
 * Bind event emitter on the object
 * @param obj
 * @param event
 */
function bindEvent(obj, event) {
  return obj.emit.bind(obj, event);
}

/**
 * Create a context for the connection with the message bus
 * @param url
 * @constructor
 */
function Context(url) {
  EventEmitter.call(this);
  var self = this;
  var promise = this._connection = amqp.connect(url, {});
  promise.then(function (conn) {
    conn.on('error', bindEvent(self, 'error'));
    conn.on('close', bindEvent(self, 'close'));
  }, bindEvent(self, 'error'));
  promise.then(bindEvent(this, 'ready'));
}
inherits(Context, EventEmitter);

/**
 * Close the connection
 * @param callback
 */
Context.prototype.close = function (callback) {
  this._connection.then(function (c) {
    c.close().then(callback);
  });
};

/**
 * Create a new communication channel with the server
 * @returns {Promise|*}
 */
Context.prototype.channel = function () {
  return this._connection.then(function (c) {
    return c.createChannel();
  });
};

/**
 * Create a new event stream based on popular patterns
 * @param type
 * @param options
 * @returns {*}
 */
Context.prototype.stream = function (type, options) {
  options = options || {};
  switch (type) {
    case 'PUBLISH':
    case 'PUB':
      return new Publish(this.channel(), options);
    case 'SUBSCRIBE':
    case 'SUB':
      return new Subscribe(this.channel(), options);
    case 'PUSH':
      return new Push(this.channel(), options);
    case 'PULL':
      return new Pull(this.channel(), options);
    case 'REQUEST':
    case 'REQ':
      return new Request(this.channel(), options);
    case 'REPLY':
    case 'REP':
      return new Reply(this.channel(), options);
  }
  return null;
};

module.exports = Context;