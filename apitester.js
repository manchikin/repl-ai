const configs = require('./configs/bootload');
const Datastore = require('nedb');
const async = require("async");
const dateFormat = require("dateformat");
const request = require('request');

const args = process.argv.slice(2)
const appUserId = args[0];
const text      = args[1];
const now       = new Date();

// replAi.createDialogue(
//       appUserId
//     , false
//     , text
//     , dateFormat(now, "yyyy-mm-dd HH:MM:ss")
//     , (err, data) => {
//         if (err) throw err;
//         console.log(":> " + data.systemText.expression);
//         process.exit(0);
//     }
// );

const hiraganaUrl = "https://api.apigw.smt.docomo.ne.jp/gooLanguageAnalysis/v1/hiragana?APIKEY=" + "48353642716e442f7548506b6e676634647345766946592f4f72624f464a494638594a666946437a4e7335";
const optionBody = {
    "sentence": process.argv[2]
    , "output_type": "hiragana"
};

const headers = {
    'Content-Type':'application/json; charset=UTF-8'
};
const hoptions = {
    method: 'POST',
    headers: headers,
    json: true,
};
const options = Object.assign({url: hiraganaUrl}, {body: optionBody}, hoptions);
console.log(options);
request(options, function(error, response, body){

    if(response.statusCode !== 200){
        error = new Error(body);
    }
    console.log(body);
});
