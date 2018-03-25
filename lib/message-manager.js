const configs = require('../configs/bootload');
const async = require("async");
const Datastore = require('nedb');
const c = require('./console');

const m = class MessageManager {
    constructor () {
        this.db = new Datastore({
            filename: configs.repl_ai.db.main.path
        });
    }
    // 自分が呼ばれたかどうか
    // @return boolean
    isSentTo (id, message)
    {
        if (message.mentions.everyone) return false;
        if (message.mentions.users.some(function(user){
            return 	user.id == id;
        })) return true;

    }

    // 返信対象者
    // @return string <@[返信対象者ID]>
    replyeeString(replyeeId)
    {
        return "<@" + replyeeId + ">";
    }

    initInsertDoc(discordId, appUserId)
    {
        return {
            discord_id     : discordId
            , first_talked_at: new Date()
            , last_talked_at : new Date()
            , app_user_id    : appUserId
            , talk_time_number : 0
            , last_suffix_data: JSON.stringify("{}")
            , favorability: configs.repl_ai.status.favorability.first_value
            , remember_name: false
            , keep_same_scenario: false
        };
    }

    isMaster(replyeeId) {
        return repleeId == configs.bot.obey_at;
    }

    isOrder(text) {
        const escaped_prefix = configs.bot.force_prefix.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1");
        const reg = new RegExp(`^\\s*<@${configs.credentials.discord_bot.id}>\\s*${escaped_prefix}`);
        return text.match(reg);
    }

    isFromAvailableChannel(channelId, callback)
    {
        c.log('メッセージ元チャンネルID：' + channelId, "debug");
        async.waterfall([
            (next) => {
                this.db.loadDatabase(next)
            },
            (next) => {
                this.db.findOne({ table: 'channels'}, next);
            },
            (doc, next) => {
                if (!doc || Object.keys(doc.availables).length === 0) return callback(null, false);
                c.log("受付中：" + doc.availables, "debug");
                if (doc.availables.includes(channelId)) return callback(null, true);
            }
        ], (err) => {
            if (err) throw err;
        });
    }

    getLoginMessage()
    {
        const messages = configs.main.message.login;
        return messages[Math.floor(Math.random()*messages.length)];
    }

}

module.exports = m;
