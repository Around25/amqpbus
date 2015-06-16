var Context = require('./context');
var Event = require('./streams/event');

/**
 * AmqpBus class
 * - abstract connection to the AMQP server and use a simpler interface to interact with it
 *
 * @param uri
 * @param onReady
 * @constructor
 */
function AmqpBus(uri, onReady) {
  this.context = new Context(uri);
  this.context.on('ready', onReady);
};

AmqpBus.prototype.getStream = function (type, event, options) {
  return new AmqpStream(this, type, event, options);
};

module.exports = AmqpBus;

/**
 * AmqpStream class
 * - simplify the interaction with the AMQP library
 * @param bus
 * @param type
 * @param event
 * @param options
 * @constructor
 */
function AmqpStream(bus, type, event, options) {
  this.bus = bus;
  // create the event stream only once at startup and just connect to it in order to sent or receive messages
  this.stream = bus.context.stream(type, options);
  this.event = event;
}

/**
 * Send a message through the event stream
 * @param msg Message to send to the amqp server
 * @param callback Get notified of a delivery or when a reply comes back from the server
 */
AmqpStream.prototype.send = function (msg, callback) {
  var stream = this.stream;
  stream.connect(this.event, function () {
    var event;
    if (msg instanceof Event) {
      event = msg;
    } else {
      event = new Event(false, msg);
    }
    stream.send(event, callback);
  });
};

/**
 * Listen for new messages on the event stream
 * @param callback Function called when a message is received.
 *                 It should have two parameters:
 *                 - event: the message received
 *                 - next: callback method to acknowledge messages or sent back a reply
 */
AmqpStream.prototype.receive = function (callback) {
  var stream = this.stream;
  stream.connect(this.event, function () {
    stream.on('message', function (event, next) {
      if (!event instanceof Event){
        event = EventStream.convertToEvent(event);
      }
      callback(event, next);
    });
  });
};

/**
 * Acknowledge or reject a message
 * @param msg
 * @returns {*}
 */
AmqpStream.prototype.ack = function (msg, action) {
  return this.stream.ack(msg, action);
};


