var express = require('express');
var VK = require('vksdk');
var router = express.Router();
var params=[];
var intervalID;
var offset;
var countPerRequest=4;
var dropCounter=0;
var maxDroped=49;
var STOP=false;

var open = require('amqplib').connect("amqp://rabbit:rabbit@192.168.1.5:5672/vk_crate");
var q = 'vk_crate';
// Publisher

var vk = new VK({
  'appId'     : 4370305,
  'appSecret' : '000000000000000000000',
  'language'  : 'ru',
  'https' : true,
  'secure'    : true
});

vk.setToken('00000000000000000000000000000000000000000000000000000000000000000000000000000000');

//router.get('/:stop', function(req, res, next) {
//  if(intervalID!=null)
//    clearInterval(intervalID);
//  res.render('index', { title: 'tanSearchTool' });
//});

/* GET home page. */
router.get('/', function(req, res, next) {
    STOP=true;
    res.render('index', { title: 'tanSearchTool' });
});

router.use('/search:start', function(req, res, next) {
    params=req.query;
    STOP=false;
    intervalID=setTimeout(vkRequest,399);

    offset=0;
  res.render('search', { title: 'Search' });
});

module.exports = router;

function vkRequest() {
    if(STOP) {
        clearTimeout(intervalID);
        return;
    }
    vk.request('execute.FindTAN', {
            // 'q': params.q,
            'sort': 1, //check

             'city': params.city,
             'university': params.university,
             'gradyear': params.gradyear,
             'sex': params.sex,
             'sp': params.sp,
             'age_from': params.age_from,
             'age_to': params.age_to,
             'online': params.online,
             'interests': params.interests,
             'gid': params.gid,
            //constratins
            'offset': offset, //check
            'min_group': params.min_group,
            'max_group': params.max_group,
            'min_friends': params.min_friends,
            'max_friends': params.max_friends,
            'min_wall': params.min_wall,
            'max_wall': params.max_wall,
            'min_subscr': params.min_subscr,
            'max_subscr': params.max_subscr,
            'min_photos': params.min_photos,
            'max_photos': params.max_photos
        },
        function (o) {

            open.then(function (conn) {
                var imqpChannel = conn.createChannel();
                imqpChannel = imqpChannel.then(function (ch) {
                    var i;var r = o.response;

                    ch.assertQueue(q);
                    if (r == "EXIT") {
                        console.log("SEARCH is OVer");
                        clearTimeout(intervalID);
                    } else {
                        intervalID = setTimeout(vkRequest, 499);
                    }
                    if (r != null) {
                        dropCounter = 0;
                        console.log("USER AccePTED");
                        r.forEach(function (person) {
                            var out = JSON.parse("{}");
                            var groupContainer = [];
                            out.counters = person.counters;
                            out.userInfo = person.userInfo;
                            out.groupsInfo={"names":[], "admined":[]};
                            out.userInfo.domain = "https://vk.com/"+person.userInfo.domain;
                            var names=[]; var admined=[];

                             if (person.groupsInfo.grpNames != [] && person.groupsInfo.grpNames.length > 0) {
                                for (i = 0; i < person.groupsInfo.grpNames.length; i++) {
                                    if(person.groupsInfo.grpNames[i]!=null)
                                        out.groupsInfo.names.push(person.groupsInfo.grpNames[i]);
                                    if(person.groupsInfo.grpIsAdmin[i]!=null)
                                        out.groupsInfo.admined.push("https://vk.com/"+ person.groupsInfo.grpScreenNames[i]);
                                }
                            }

                            out.wallInfo={"texts":[], "pics":[]};
                            if (person.wallInfo.texts != [] && person.wallInfo.texts.length > 0) {
                                for (i = 0; i < person.wallInfo.texts.length; i++) {
                                    texts=[]; pics=[];
                                    if(person.wallInfo.texts[i]!=null)
                                        out.wallInfo.texts.push(person.wallInfo.texts[i]);
                                    if(person.wallInfo.repTexts[i]!=null)
                                        out.wallInfo.texts.push(person.wallInfo.repTexts[i]);
                                    if(person.wallInfo.pics[i]!=null)
                                        out.wallInfo.pics.push(person.wallInfo.pics[i]);
                                    if(person.wallInfo.repPics[i]!=null)
                                        out.wallInfo.pics.push(person.wallInfo.repPics[i]);
                                }
                            }

                            out.friendsInfo = person.friendsInfo;

                            out.friendsInfo.sex={"mens":0, "womens": 0, "traps":0};
                            var mens=0; var womens=0; var traps=0;
                            var analized= parseInt(person.friendsInfo.analized);
                            if (person.friendsInfo.fsex != [] && person.friendsInfo.fsex.length > 0) {
                                for (i = 0; i < person.friendsInfo.fsex.length; i++) {
                                    if (parseInt(person.friendsInfo.fsex[i]) == 0)
                                        traps++;
                                    if (parseInt(person.friendsInfo.fsex[i]) == 1)
                                        womens++;
                                    if (parseInt(person.friendsInfo.fsex[i]) == 2)
                                        mens++;
                                }
                            }

                            out.friendsInfo.sex.mens = mens / analized;
                            out.friendsInfo.sex.womens= womens / analized;
                            out.friendsInfo.sex.traps= traps/ analized;

                           // out.pics = person.photos;
                            ch.sendToQueue(q, new Buffer(JSON.stringify(out)));
                           console.log(out.userInfo.city);
                        });
                    } else {
                        console.log("USERS DroPPED");
                        dropCounter++;
                        if (dropCounter >= maxDroped) {
                            console.log("how about to set less restricted rules4search? :3");
                        }
                    }
                    console.log("offset: "+offset)

                });
                return imqpChannel;
            }).then(null, console.warn);
            offset += countPerRequest;
        });
}

