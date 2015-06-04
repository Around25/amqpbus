var EventStream = require('./event-stream');
var inherits = require('util').inherits;
var guid = require('node-uuid').v4;

/**
 * Request class to handle sending a message to one client and wait for a reply.
 * The request event stream creates a queue for any incoming messages and emits
 * a "message.<correlationId>" for any received message.
 * @param channel
 * @param options Can have the following options: prefetch, expiration, persistent, topic, task
 * @constructor
 */
function Request(channel, options) {
  EventStream.call(this, channel, options);
  var self = this,
    replyQueueOptions = {exclusive: true, autoDelete: true},
    consumeOptions = {noAck: false, exclusive: true};
  self.replyQueue = null;
  //setup response queue
  this.channel.then(function (channel) {
    return channel.assertQueue('', replyQueueOptions)
      .then(function (ok) {
        self.replyQueue = ok.queue;
        return channel.consume(ok.queue, function (msg) {
          self.emit('message.' + msg.properties.correlationId, msg, function () {
            channel.ack(msg);
          });
        }, consumeOptions);
      })
      .then(function () {
        return channel;
      });
  });
}
inherits(Request, EventStream);

/**
 * Connect the event stream to the destination
 * @param destination
 * @param callback
 * @returns {Promise|*}
 */
Request.prototype.connect = function (destination, callback) {
  var queueOptions = {durable: this.options.persistent};

  this.queue = destination;

  return this.channel.then(function (channel) {
    return channel
      .assertQueue(destination, queueOptions)
      .then(function (ok) {
        callback(ok);
        return channel;
      });
  });
};

/**
 * Send a message to the AMQP server and call the callback function after the reply is received.
 * Each request has a new <correlationId> generated. The event stream adds an event listener for
 * the "message.<correlationId>" then sends the message to the AMQP message bus. When a message
 * with the same correlationId is received back the callback method is called.
 * @param message
 * @param encoding
 * @param callback
 * @returns {Promise|*}
 */
Request.prototype.send = function (message, encoding, callback) {
  var self = this;
  var corrId = guid();
  var options = {
    replyTo: this.replyQueue,
    deliveryMode: true,
    correlationId: corrId,
    expiration: this.options.expiration,
    persistent: this.options.persistent
  };

  return this.channel.then(function (channel) {
    self.once('message.' + corrId, function (replyMsg, next) {
      callback({body: JSON.parse(replyMsg.content.toString()), properties: replyMsg.properties, fields: replyMsg.fields, amqpMsg: replyMsg});
      // auto ack the reply message
      next();
    });
    return channel.sendToQueue(self.queue, new Buffer(JSON.stringify(message), encoding), options);
  });
};

module.exports = Request;