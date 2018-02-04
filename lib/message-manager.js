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
            , favorability: configs.repl_ai.status.first_favorability
        };
    }

    isMaster(replyeeId) {
        return repleeId == configs.bot.obey_at;
    }

    isOrder(text) {
        const escaped_prefix = configs.bot.force_prefix.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1");
        const reg = new RegExp(`^\\s*<@${configs.bot.id}>\\s*${escaped_prefix}`);
        return text.match(reg);
    }

    isFromAvailableChannel(channelId, callback)
    {
        c.debug('メッセージ元チャンネルID：' + channelId);
        async.waterfall([
            (next) => {
                this.db.loadDatabase(next)
            },
            (next) => {
                this.db.findOne({ table: 'channels'}, next);
            },
            (doc, next) => {
                if (!doc || Object.keys(doc.availables).length === 0) return callback(null, false);
                c.debug("受付中：" + doc.availables);
                if (doc.availables.includes(channelId)) return callback(null, true);
            }
        ], (err) => {
            if (err) throw err;
        });
    }

}

module.exports = m;
