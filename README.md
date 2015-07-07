amqpbus
=======

A simpler way to interact with an AMQP server from a nodejs application

[![Build Status](https://travis-ci.org/Around25/amqpbus.svg)](http://travis-ci.org/Around25/amqpbus)

Install
-------
```
npm install amqpbus --save
```

Example
-------

### Server.js
```javascript
var MessageBus = require('amqpbus');
var bus = new MessageBus('amqp://' + process.env.RABBITMQ_PORT_5672_TCP_ADDR, function () {
  // connected
});

// subscribe to "notification" messages
var stream = bus.getStream('SUB', 'notify', {prefetch: 1});

// listen for "auth" requests
var replyStream = bus.getStream('REP', 'auth', {prefetch: 1});

// handle notifications
stream.receive(function (event, next) {
  console.log('Notification:', event.body);
  next(); // acknowledge the message as received
});

// handle a request message
replyStream.receive(function (event, next) {
  console.log('Auth message:', event.body);
  next({user: 'Cosmin'}); // send back a reply message
});
```

### Client.js
```javascript
var MessageBus = require('amqpbus');
var bus = new MessageBus('amqp://' + process.env.RABBITMQ_PORT_5672_TCP_ADDR, function () {
  // connected
});

var pubStream = bus.getStream('PUB', 'notify');
var reqStream = bus.getStream('REQ', 'auth');

// publish a notification
pubStream.send({content: 'John just signed out'});

// make an RPC call
reqStream.send({user: 'cosmin', pass: 'secret'}, function (msg){
  console.log('User:', msg.body);
});
```

License
=======

The MIT License (MIT)

Copyright (c) 2015 Around25

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.