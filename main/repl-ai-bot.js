const configs = require('../configs/bootload');
const MessageManager = require('../lib/message-manager');
const mm = new MessageManager();
const ReplAI = require('../lib/repl-ai');
const replAiOptions = {
      x_api_key: configs.repl_ai.x_api_key
    , botId: configs.repl_ai.bot_id
};
const replAi = new ReplAI(replAiOptions);
const Datastore = require('nedb');
const c = require('../lib/console');
const dateFormat = require("dateformat");
const DialogueManager = require('../lib/dialogue-manager');
const dm = new DialogueManager();
const db = new Datastore({
    filename: configs.repl_ai.db.main.path
});
const AffixManager = require('../lib/repl-ai/affix-manager');

const async = require("async");

function start_repl_ai(message) {
    const replyeeId = message.author.id;
    let isInit = false;
    let response = {}; // createDialogueにて返却されたデータ
    let lastTalkedAt;
    let talkTimeNumber = 0;
    let am; //AffixManager

    const text = message.content.match(/(.*\d>|@everyone|@here)\s*(.*)$/)[2];

    async.waterfall([
        function(callback) {
            db.loadDatabase(callback);
        },
        function(callback) {
            db.findOne({discord_id: replyeeId}, callback);
        },
        function(doc, callback) {
            c.info("知り合い？");
            c.debug(doc);
            if (!doc) {
                c.info("知らない人");
                isInit = true;
                lastTalkedAt = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
                replAi.register(callback);

            } else {
                c.info("知ってた");
                isInit = false;
                talkTimeNumber = doc.talk_time_number;
                const data = Object.assign({isInit: false}, doc);
                lastTalkedAt = dateFormat(doc.last_talked_at, "yyyy-mm-dd HH:MM:ss");
                callback(null, data);
            }
        },
        function (data, callback) {
            if (isInit) {
                c.info("覚えた");
                db.insert(mm.initInsertDoc(replyeeId, data.appUserId), callback);
            } else {
                callback(null, data);
            }
        },
        function (doc, callback) {
            c.debug("こう聞かれた");
            c.debug(":> " + text);
            c.info("prefix反映作業開始");
            am = new AffixManager(doc);
            const prefix = am.getPrefix();
            c.debug("prefix追加判定後文字列");
            c.debug(":> " + prefix + text);
            const replOptions = {
                appUserId: doc.app_user_id
                , voiceText: prefix + text
                , initTopicId: configs.repl_ai.root_topic_id
                , appRecvTime: lastTalkedAt
            };

            c.info("ダイアログ実行");
            replAi.createDialogue(replOptions, callback);
        },
        function(data, callback) {
            response = data;
            c.info('suffix取得処理')
            const suffix = am.getSuffixDataOf(response.systemText.expression);
            c.debug("suffix:");
            c.debug(suffix);
            c.info("最後の会話日時を記憶する");
            db.update({discord_id: replyeeId},
                 {$set: {last_talked_at: new Date()
                       , talk_time_number: talkTimeNumber + 1
                       , last_suffix_data: suffix.suffixString
                       , favorability: suffix.updateFavorability
                   }}, {}, callback)
            response.responseMessage = suffix.responseText;
            dm.outputDialogueLog(replyeeId, text, suffix.responseText, suffix.string, suffix.updateFavorability);
        },
        function () {
            c.info("返答する");
            c.debug(response.responseMessage);
            message.channel.send(mm.replyeeString(replyeeId) + " " + response.responseMessage);
        }
    ],
    function(err, result){
        if(err) throw err;
    });
}
module.exports.startUp = start_repl_ai;
