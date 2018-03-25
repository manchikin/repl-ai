const configs = require('../../configs/bootload');
const async = require("async");
const Datastore = require('nedb');
const db = new Datastore({
    filename: configs.repl_ai.db.main.path
});


class ReplAiDb
{
    constructor (speakerId, callback)
    {
        const self = this;
        async.waterfall([
                function(next) {
                    db.loadDatabase(next);
                },
                function(next) {
                    db.findOne({discord_id: speakerId}, next);
                },
                function(doc, next) {
                    self.dbResult = doc;
                    callback();
                }
            ],
            function(err, result){
                if(err) throw err;
            }
        );
    }
}

module.exports = ReplAiDb;
