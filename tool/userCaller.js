const configs = require('../configs/bootload');
const MessageManager = require('../lib/message-manager');
const mm = new MessageManager();
const Datastore = require('nedb');
const c = require('../lib/console');
const dateFormat = require("dateformat");
const db = new Datastore({
    filename: configs.repl_ai.db.main.path
});
const async = require("async");


const userId = process.argv[2];
console.log("user id is: " + userId);
async.waterfall([
        function(callback) {
            db.loadDatabase(callback);
        },
        function(callback) {
            db.findOne({discord_id: userId}, callback);
        },
        (doc, callback) => {
            console.log(doc);
        }
    ], (err) => {
        if (err) throw err;
    }
);
