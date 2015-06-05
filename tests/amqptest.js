/**
 * Created by Ray on 21.05.2015.
 */
var q = 'tasks';

var open = require('amqplib').connect("amqp://rabbit:rabbit@192.168.1.5:5672/vk_crate");
var JSONB = require('json-buffer')

var a = JSON.parse('{ "photos" : 6, "subscribers" : 63, "wallPosts" : 184, "group" : 116, "Friends" : 150 }');
console.log(JSON.stringify(a));
console.log(a);

// Publisher
open.then(function(conn) {
    var ok = conn.createChannel();
    ok = ok.then(function(ch) {
        ch.assertQueue(q);
        ch.sendToQueue(q, new Buffer(JSON.stringify(a)));
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