/**
 * Created by Ray on 21.05.2015.
 */
var q = 'tasks';

var open = require('amqplib').connect("amqp://rabbit:rabbit@bakas.hk:5672/vk_crate");

// Publisher
open.then(function(conn) {
    var ok = conn.createChannel();
    ok = ok.then(function(ch) {
        ch.assertQueue(q);
        ch.sendToQueue(q, new Buffer('something to do'));
        ch.sendToQueue(q, new Buffer('{vk:api}'));
    });
    return ok;
}).then(null, console.warn);

// Consumer
open.then(function(conn) {
    var ok = conn.createChannel();
    ok = ok.then(function(ch) {
        ch.assertQueue(q);
        ch.consume(q, function(msg) {
            if (msg !== null) {
                console.log(msg.content.toString());
                ch.ack(msg);
            }
        });
    });
    return ok;
}).then(null, console.warn);