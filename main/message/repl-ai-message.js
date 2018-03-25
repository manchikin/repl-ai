const configs = require('../../configs/bootload');
const async = require("async");
const ReplAiDb = require('./repl-ai-db');

class ReplAiMessage
{
    constructor(message, callback)
    {
        this.dbSpeaker = null;
        const self = this;


        async.waterfall([
                function(next) {
                    self.replAiDB = new ReplAiDb(message.author.id, next);
                },
                function(next) {
                    callback(null);
                }
            ],
            function(err, result){
                if(err) throw err;
            }
        );
    }

    checkIsInit()
    {
        
    }

}

module.exports = ReplAiMessage;
