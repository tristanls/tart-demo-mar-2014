/*

index.js: TartJS Demo

The MIT License (MIT)

Copyright (c) 2014 Tristan Slominski

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/
"use strict";

var tart = require('tart');

// DISCLAIMER:
//
// We will "cheat" for pedagogical purposes where necessary. For example, we
// will synchronously log to console using console.log('things'), especially
// in the beginning.



// Actor = state + behavior



// Actor behavior in TartJS:
// - a function that takes a single argument: message



function demoBehavior(message) {
    console.log(message);
};



// We can excersise the behavior.



demoBehavior('print me');



// Actor state:
// - we need to package state somehow
// - in Tarjs we chose to package state in a closure
//   - this has numerous benefits



function counterActor(state) {
    return function counterActorBeh(message) {
        state += message;
    };
};



function counterActor(state) {
    return function counterActorBeh(message) {
        console.log('start count:  ', state);
        console.log('message:      ', message);

        state += message;

        console.log('end count:    ', state);
    };
};

var counterBeh = counterActor(0);
console.log(counterBeh);

counterBeh(1);
counterBeh(2);
counterBeh(-10);



// Actor state captured in closure:
// - pros:
//   - makes the actor state private to the behavior
//   - nicely and transparently packages state + behavior
// - cons:
//   - debugging the "old way" is difficult as state cannot be inspected
//     without invoking the behavior, need special debugger to get at closure



// Actor = state + behavior



// Actor Model:
// - create
// - send
// - become



// Actor Model:
// * create
// - send
// - become



// TartJS provides a create primitive in form of a sponsor.
// - sort of like an actor factory



var sponsor = tart.minimal();

function demoBehavior(message) {
    console.log(message);
};

var demoActor = sponsor(demoBehavior);



// To provide an actor with state, we capture the state in the behavior.



function counterActor(state) {
    return function counterActorBeh(message) {
        console.log('start count:  ', state);
        console.log('message:      ', message);

        state += message;

        console.log('end count:    ', state);
    };
};

var counterActorBehWithState = counterActor(1337);
var counter = sponsor(counterActorBehWithState);

// or

var counter = sponsor(counterActor(1337));



// But counter is not what you think it is :)



// Actor Model:
// * create
// * send
// - become



// When creating an actor using TartJS, you get back a *capability*
// to send that actor a message.



var counter = sponsor(counterActor(1337));

console.log(counter);



// This answers the question of how we send messages to actors.



// Send message to counter by invoking the capability to send it a message.
// Invoking a capability in TartJS is invoking a function.


counter(0);
counter(-1);
counter(-1336);



// This sends the messages *asynchronously* to the actor identified by
// the capability.



// Another illustration of this:



function pingBeh(message) {
    var pong = message;

    console.log('[PING****] send');
    pong(this.self);
    console.log('[PING****] finish');
};

function pongActor(count) {
    return function pongBeh(message) {
        var ping = message;

        if (count == 0) {
            console.log('[****PONG] -- DONE --');
            return;
        }

        console.log('[****PONG] send');
        ping(this.self);
        console.log('[****PONG] finish');
        count = count - 1;
    };
};

var ping = sponsor(pingBeh);
var pong = sponsor(pongActor(2));

ping(pong);



// Notice that TartJS provides access to this.self.
// This means that the actor has a reference to the *capability* that will
// send it a message.



function showSelfBeh(message) {
    console.log(this.self);
};

var showSelf = sponsor(showSelfBeh);

showSelf();



// What else does the actor have access to?



function showAllBeh(message) {
    console.dir(this);
};

var showAll = sponsor(showAllBeh);

showAll();



// Notice that the actor has access to everything it needs.
// - Create: available via this.sponsor
// - Send: available via this.self and anything received in a message
// - Become: available via this.behavior



// Actor Model:
// - create
// - send
// * become



function sayRedBeh(message) {
    console.log('[SAYING]: red');
    this.behavior = sayBlackBeh;
};

function sayBlackBeh(message) {
    console.log('[SAYING]: black');
    this.behavior = sayRedBeh;
};

var say = sponsor(sayRedBeh);

say();



// Actor Model:
// - create
// - send
// - become



function flipperActor(state) {
    var flipUpBeh = function flipUpBeh(message) {
        console.log(state, 'flipping up...');
        state = 'up';
        this.behavior = flipDownBeh;
    };
    var flipDownBeh = function flipDownBeh(message) {
        console.log(state, 'flipping down...');
        state = 'down';
        this.behavior = flipUpBeh;
    };
    return flipDownBeh;
};

var flipper = sponsor(flipperActor('neither'));

flipper();
flipper();
flipper();



// There is a fine distinction here. The state might look like it is
// "shared state". It is not. Remember that Actor = state + behavior.
// We are not sharing the state outside the actor. We are making it
// accessible to the two behaviors that the actor can become.



// Actor idioms
// - Dale Schumacher's Actor Idioms paper
// - https://apice.unibo.it/xwiki/bin/download/AGERE2012/AcceptedPapers/ageresplash2012submission3.pdf



// Service
// - request/reply
// - so ingrained in our programming models that it is often invisible



function serviceBeh(message) {
    var customer = message.customer;
    customer('some data');
};

var service = sponsor(serviceBeh);

var log = sponsor(function (message) {
    console.log('CUSTOMER\n', message);
});

service({customer: log});



// Ignore
// - ignores all messages it receives



function ignoreBeh(message) {};

var ignore = sponsor(ignoreBeh);

ignore();



// Forward
// - an alias or a proxy
// - forwards all messages to the Subject



function forwardActor(subject) {
    return function forwardBeh(message) {
        subject(message);
    };
};

var forward = sponsor(forwardActor(log));

forward('hi');
forward('there');



// One-Shot
// - a Forward actor that will forward only a single message



function oneShotActor(subject) {
    return function oneShotBeh(message) {
        subject(message);
        this.behavior = ignoreBeh;
    };
};

var oneShot = sponsor(oneShotActor(log));

oneShot('are we there yet?');
oneShot('are we there yet?');
oneShot('are we there yet?');



// Label
// - a Forward actor that adds some fixed information to the message



function labelActor(subject, label) {
    return function labelBeh(message) {
        subject({
            label: label,
            message: message
        });
    };
};

var label = sponsor(labelActor(log, 'ALL THE THINGS!'));

label('label me');
label(17);
label({some: 'object'});



// Tag
// - a special kind of Label
// - labels each message with a reference to itself (capability to send)
//   - an actor reference is a capability to send
//   - it is *unforgeable* in TartJS



function tagActor(subject) {
    return function tagBeh(message) {
        subject({
            tag: this.self,
            message: message
        });
    };
};

var tag = sponsor(tagActor(log));

tag('data');



// Race
// - try things in parallel and pick the first one



function oneShotActor(subject) {
    return function oneShotBeh(message) {
        subject(message);
        this.behavior = ignoreBeh;
    };
};

function raceActor(services) {
    return function raceBeh(message) {
        var customer = message.customer;
        var oneShot = this.sponsor(oneShotActor(customer));

        message.customer = oneShot;

        services.forEach(function (service) {
            service(message);
        });
    };
};

function randomServiceActor(id) {
    return function randomServiceBeh(message) {
        var customer = message.customer;
        setTimeout(function () {
            customer({id: id});
        }, Math.random() * 10000);
    };
};

var services = [sponsor(randomServiceActor(1)),
                sponsor(randomServiceActor(2)),
                sponsor(randomServiceActor(3)),
                sponsor(randomServiceActor(4)),
                sponsor(randomServiceActor(5)),
                sponsor(randomServiceActor(6)),
                sponsor(randomServiceActor(7)),
                sponsor(randomServiceActor(8)),
                sponsor(randomServiceActor(9)),
                sponsor(randomServiceActor(10))];

var race = sponsor(raceActor(services));

race({customer: log});



// Work-Order / Saga
// - captures the state of a particular workflow



// Imagine you have three services: billing, reporting, shipping
//
//            +-> billing ---+
// new order -+              +-> "order ready!" -> shipping -> "order shipped!"
//            +-> reporting -+
//



function workOrderActor(customer, shipping) {
    var state = {};
    return function workOrderBeh(message) {
        if (message.billed) {
            state.billed = true;
        } else if (message.reported) {
            state.reported = true;
        } else if (message.shipped) {
            state.shipped = true;
        }

        if (state.billed && state.reported && !state.shipped) {
            shipping({customer: this.self});
            customer('order ready!');
        }
        if (state.shipped) {
            customer('order shipped!');
            this.behavior = ignoreBeh;
        }
    };
};

function billingServiceBeh(message) {
    setTimeout(function () {
        console.log('BILLED');
        var customer = message.customer;
        customer({billed: true});
    }, Math.random() * 10000);
};

function reportingServiceBeh(message) {
    setTimeout(function () {
        console.log('REPORTED');
        var customer = message.customer;
        customer({reported: true});
    }, Math.random() * 10000);
};

function shippingServiceBeh(message) {
    setTimeout(function () {
        console.log('SHIPPED');
        var customer = message.customer;
        customer({shipped: true});
    }, Math.random() * 3000);
};

function myServiceActor(billing, reporting, shipping) {
    return function myServiceBeh(message) {
        var customer = message.customer;
        var workOrder = this.sponsor(workOrderActor(customer, shipping));
        billing({customer: workOrder});
        reporting({customer: workOrder});
    };
};

var billing = sponsor(billingServiceBeh);
var reporting = sponsor(reportingServiceBeh);
var shipping = sponsor(shippingServiceBeh);
var myService = sponsor(myServiceActor(billing, reporting, shipping));

myService({customer: log});



// Other idioms not elaborated here:
// - Sync-Signal: message with no contents ("undefined")
// - State-Machine: using become to transition between states
// - Authorization-Token: using Tag for authorization of messages
// - Future: do stuff.. in the FUTURE!
// - Lazy-Result: do stuff.. in the FUTURE!.. when asked
// - Fork-Join: parallel execution that waits for all to complete
// - Serializer: serial one-after-another execution in steps



// Revocable proxy



function revocableProxy(actor) {
    return function revocableProxyBeh(message) {
        if (message === actor) {
            this.behavior = ignoreBeh;
        } else {
            actor(message);
        }
    };
};
// http://www.reactiongifs.com/wp-content/uploads/2011/09/mind_blown.gif

var logProxy = sponsor(revocableProxy(log));

logProxy('hi');
logProxy('there');
logProxy('proxy?');

// REVOKE!
logProxy(log);

logProxy('hi');
log('hi?');



// Remote communication... transports



// Transport protocol:
// {
//   address: ...,
//   content: ...,
//   fail:    ...,
//   ok:      ...,
// }



// TartJS UDP transport



var transport = require('tart-transport-udp');

var sendUdp = sponsor(transport.sendBeh);

function receptionistActor(id) {
    return function receptionistBeh(message) {
        console.log('[RECEPTIONIST - ' + id + '] received ', message);
    };
};

var receptionist9000 = sponsor(receptionistActor('9000'));
var receptionist9001 = sponsor(receptionistActor('9001'));

var udp9000Caps = transport.server(receptionist9000);
var udp9001Caps = transport.server(receptionist9001);

var listen9000 = sponsor(udp9000Caps.listenBeh);
var listen9001 = sponsor(udp9001Caps.listenBeh);

var listenAck = sponsor(function listenAckBeh(message) {
    console.log('listening on udp://' + message.host + ':' + message.port);
});

listen9000({host: 'localhost', port: 9000, ok: listenAck});
listen9001({host: 'localhost', port: 9001, ok: listenAck});

sendUdp({
    address: 'udp://localhost:9000',
    content: '{"for":9000}'
});

sendUdp({
    address: 'udp://localhost:9001',
    content: '{"for":9001}'
});



// Tart Marshal
// - send messages between memory domains



var marshal = require('tart-marshal');

var domain5555 = marshal.domain('udp://localhost:5555', sponsor, sendUdp);
var domain7777 = marshal.domain('udp://localhost:7777', sponsor, sendUdp);

var udp5555Caps = transport.server(domain5555.receptionist);
var udp7777Caps = transport.server(domain7777.receptionist);

var listen5555 = sponsor(udp5555Caps.listenBeh);
var listen7777 = sponsor(udp7777Caps.listenBeh);

listen5555({host: 'localhost', port: 5555, ok: listenAck});
listen7777({host: 'localhost', port: 7777, ok: listenAck});

function in5555Beh(message) {
    console.log('in5555 got message:', message);
    if (message.first) {
        message.customer({customer: this.self});
    }
};

function in7777Beh(message) {
    console.log('in7777 got message:', message);
    // always reply
    message.customer({customer: this.self});
};

var in5555 = domain5555.sponsor(in5555Beh);
var in7777 = domain7777.sponsor(in7777Beh);

// Need to introduce the domains to each other

// 1. Marshal in5555 actor from domain5555

var in5555Address = domain5555.localToRemote(in5555);
console.log(in5555Address);

// 2. Marshal in5555 actor address into domain7777

var to5555Proxy = domain7777.remoteToLocal(in5555Address);
console.log(to5555Proxy);

// to5555Proxy is the forwarding proxy that domain7777 sees internally.
// We use it to send the message as if it came from domain7777.

to5555Proxy({customer: in7777, first: true});



// Intergallactic Messaging Framework - Ansible
// - see tart-ansible README example



// All the way to the browser
// - using Ansible to send any message to anywhere
// - see tart-transport-eventsource README example
