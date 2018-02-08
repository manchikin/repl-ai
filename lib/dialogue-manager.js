const configs = require('../configs/bootload');
const c = require('console');
const Datastore = require('nedb');

const dm = class DialogueManager {
    constructor() {
        this.db = new Datastore({
            filename: configs.repl_ai.db.dialogue_log.path
        });
    }
    outputDialogueLog(discordId, requestMessage, responseMessage, suffix, favorability) {
        const doc = {
            dialogue_created: new Date()
            , discord_id: discordId
            , request_message: requestMessage
            , response_message: responseMessage
            , response_suffix: suffix
            , updated_favorability: favorability
        };
        this.db.loadDatabase((err) => {
            if (err) {
                c.log("ログ記載エラー", "debug");
                return;
            }
            this.db.insert(doc, (err, newDoc) => {
                if (err) {
                    c.log("ログ記載エラー", "debug")
                    return;
                };
                c.log(newDoc, "debug");
            });
        });
    }
}

module.exports = dm;
