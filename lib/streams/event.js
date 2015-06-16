module.exports = Event;

function Event(name, message, options) {
  this.name = name || '';
  this.message = message;
  this.options = options || {};
}

Event.prototype.getName = getName;
Event.prototype.setName = setName;

Event.prototype.getMessage = getMessage;
Event.prototype.setMessage = setMessage;

Event.prototype.getOptions = getOptions;
Event.prototype.setOptions = setOptions;

function getName() {
  return this.name;
}

function setName(name) {
  this.name = name;
  return this;
}

function getMessage() {
  return this.message;
}

function setMessage(message) {
  this.message = message;
  return this;
}

function getOptions() {
  return this.options;
}

function setOptions(options) {
  this.options = options;
  return this;
}