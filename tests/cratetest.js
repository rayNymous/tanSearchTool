/**
 * Created by Ray on 21.05.2015.
 */
var crate = require('node-crate');
crate.connect ('bakas.hk', 4200);
crate.execute ("select * from tweets limit 5 ").success (function (res){
    console.log ('Success', res.json, res.duration, res.rowcount, res.cols, res.rows)
});
//crate.insert ('mytable', {columnName1: 'value1', columnName2: 'value2'}).success (console.log)