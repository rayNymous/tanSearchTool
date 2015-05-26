var express = require('express');
var VK = require('vksdk');
var router = express.Router();
var params=[];
var intervalID;
var offset=0;

var vk = new VK({
  'appId'     : 0000000,
  'appSecret' : '0000000000000',
  'language'  : 'ru',
  'https' : true,
  'secure'    : true
});

vk.setToken('0000000000000000000000000000000000000000000000000000000000000000');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'tanSearchTool' });
});

router.use('/search:start', function(req, res, next) {
  console.log("m:"+ req.method);
  console.log("q::" + req.query.q);
  params=req.query;

  if(intervalID!=null)
    clearInterval(intervalID);
  intervalID=setInterval(vkRequest,500);

  res.render('search', { title: 'Search' });
});

router.use('/search:stop', function(req, res, next) {
  clearInterval(intervalID);
});

module.exports = router;

function vkRequest(){
  vk.request('execute.FindTAN',
      {
        'q': params.q,
        'sort':params.sorttype, //check
        'offset':offset, //check
        'city': params.city,
        'university':params.university,
        'gradyear':params.gradyear,
        'sex':params.sex,
        'sp':params.sp,
        'age_from':params.age_from,
        'age_to':params.age_to,


      },
      function (_o) {
      console.log(_o.response);
    });
}