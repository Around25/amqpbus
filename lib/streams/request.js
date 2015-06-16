var Event = require('./event');
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
    replyQueueOptions = {exclusive: true, autoDelete: true, durable: false},
    consumeOptions = {noAck: false, exclusive: true, durable: false};
  this.replyQueue = null;
  // setup reply queue
  this.createQueue('', replyQueueOptions, function (ok, channel) {
    self.replyQueue = ok.queue;
    // start consuming messages from the reply queue
    return channel.consume(ok.queue, function (msg) {
      var event = EventStream.convertToEvent(msg);
      self.emit('message.' + event.options.properties.correlationId, event, function () {
        channel.ack(msg);
      });
    }, consumeOptions);
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
  var queueOptions = {durable: this.options.durable};
  this.queue = destination;

  return this.createQueue(destination, queueOptions, callback);
};

/**
 * Send a message to the AMQP server and call the callback function after the reply is received.
 * Each request has a new <correlationId> generated. The event stream adds an event listener for
 * the "message.<correlationId>" then sends the message to the AMQP message bus. When a message
 * with the same correlationId is received back the callback method is called.
 * @param event
 * @param callback
 * @returns {Promise|*}
 */
Request.prototype.send = function (event, callback) {
  var self, corrId, options, message, encoding;
  self = this;
  // generate unique id for the request
  corrId = guid();
  // setup options for the new message
  options = {
    replyTo: this.replyQueue,
    deliveryMode: false,
    correlationId: corrId,
    expiration: this.options.expiration,
    persistent: this.options.persistent
  };
  encoding = this.options.encoding;
  message = event;
  if (event instanceof Event) {
    message = event.getMessage();
    options.expiration = event.options.expiration || this.options.expiration;
    options.persistent = event.options.persistent || this.options.persistent;
  }

  return this.channel.then(function (channel) {
    // listen for a response message before sending the request
    self.once('message.' + corrId, function (replyEvent, next) {
      callback(replyEvent);
      // auto ack the reply message
      next();
    });
    // send the request message through the default exchange
    return channel.publish(self.exchange, self.queue, new Buffer(JSON.stringify(message), encoding), options);
//    return channel.sendToQueue(self.queue, new Buffer(JSON.stringify(message), encoding), options);
  });
};

module.exports = Request;