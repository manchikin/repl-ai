const configs = require('../configs/bootload');
const MessageManager = require('../lib/message-manager');
const mm = new MessageManager();
const ReplAI = require('../lib/repl-ai');
const replAiOptions = {
      x_api_key: configs.credentials.repl_ai.x_api_key
    , botId: configs.credentials.repl_ai.bot_id
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
const FavM = require('../lib/repl-ai/favorability-manager');

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
            c.log("知り合い？", "info");
            c.log(doc, "debug");
            if (!doc) {
                c.log("知らない人", "info");
                isInit = true;
                lastTalkedAt = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
                replAi.register(callback);

            } else {
                c.log("知ってた", "info");
                isInit = false;
                talkTimeNumber = doc.talk_time_number;
                const data = Object.assign({isInit: false}, doc);
                lastTalkedAt = dateFormat(doc.last_talked_at, "yyyy-mm-dd HH:MM:ss");
                callback(null, data);
            }
        },
        function (data, callback) {
            if (isInit) {
                c.log("覚えた", "info");
                db.insert(mm.initInsertDoc(replyeeId, data.appUserId), callback);
            } else {
                callback(null, data);
            }
        },
        function (doc, callback) {
            c.log("こう聞かれた", "debug");
            c.log(":> " + text, "debug");
            c.log("prefix反映作業開始", "info");
            am = new AffixManager(doc);
            const prefix = am.getPrefix();
            c.log("prefix追加判定後文字列", "debug");
            c.log(":> " + prefix + text, "debug");
            const replOptions = {
                appUserId: doc.app_user_id
                , voiceText: prefix + text
                , initTopicId: configs.repl_ai.root_topic_id
                , appRecvTime: lastTalkedAt
            };

            c.log("ダイアログ実行", "info");
            replAi.createDialogue(replOptions, callback);
        },
        function(data, callback) {
            response = data;
            c.log('suffix取得処理', "info")
            const suffix = am.getSuffixDataOf(response.systemText.expression);
            c.log("suffix:", "debug");
            c.log(suffix, "debug");
            c.log("最後の会話日時を記憶する", "info");
            const insertFavorability = suffix.updateFavorability + FavM.getPlusFavorabilityPerTalk(suffix.updateFavorability);
            db.update({discord_id: replyeeId},
                 {$set: {last_talked_at: new Date()
                       , talk_time_number: talkTimeNumber + 1
                       , last_suffix_data: suffix.suffixString
                       , favorability: insertFavorability
                   }}, {}, callback)
            response.responseMessage = suffix.responseText;
            dm.outputDialogueLog(replyeeId, text, suffix.responseText, suffix.suffixString, insertFavorability);
        },
        function () {
            c.log("返答する", "info");
            c.log(response.responseMessage, "debug");
            message.channel.send(mm.replyeeString(replyeeId) + " " + response.responseMessage);
        }
    ],
    function(err, result){
        if(err) throw err;
    });
}
module.exports.startUp = start_repl_ai;
