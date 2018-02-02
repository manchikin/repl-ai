const configs = require('../configs/bootload');
const mm = require('../lib/message-manager');
const ReplAI = require('../repl-ai');
const replAi = new ReplAI(configs.repl_ai.x_api_key, configs.repl_ai.bot_id, configs.repl_ai.init_topic_id);
const Datastore = require('nedb');
const c = require('../lib/console');
const dateFormat = require("dateformat");
const DialogueManager = require('../lib/dialogue-manager');
const dm = new DialogueManager();
const db = new Datastore({
    filename: configs.repl_ai.db.user_info.path
});

const async = require("async");

function start_repl_ai(client) {
    // メッセージ受信時の処理
    client.on("message", (message) => {
        const replyeeId = message.author.id;
        let isInit = false;
        let response = {}; // createDialogueにて返却されたデータ

        if (!mm.isSentTo(configs.bot.id, message)) return;
        const text = message.content.match(/(.*\d>|@everyone|@here)\s*(.*)$/)[2];

        async.waterfall([
            function(callback) {
                db.loadDatabase(callback);
            },
            function(callback) {
                db.findOne({id: replyeeId}, callback);
            },
            function(doc, callback) {
                c.info("知り合い？");
                c.debug(doc);
                if (!doc) {
                    c.info("知らない人");
                    isInit = true;
                    replAi.register(callback);

                } else {
                    c.info("知ってた");
                    isInit = false;
                    const data = {isInit: false, appUserId: doc.app_user_id};
                    callback(null, data);
                }
            },
            function (data, callback) {
                if (isInit) {
                    c.info("覚えた");
                    db.insert(mm.initInsertDoc(replyeeId, data.appUserId), callback);
                } else {
                    callback(null, {app_user_id: data.appUserId});
                }
            },
            function (doc, callback) {
                c.debug("こう聞かれた");
                c.debug(":> " + text);
                const lastTalkedAt = dateFormat(doc.last_talked_at, "yyyy-mm-dd HH:MM:ss");
                replAi.createDialogue(doc.app_user_id, isInit, text, lastTalkedAt, callback);
            },
            function(data, callback) {
                response = data;
                c.info("最後の会話日時を記憶する");
                db.update({id: replyeeId}, {$set: {last_talked_at: new Date()}}, {}, callback)
                dm.outputDialogueLog(replyeeId, text, response.systemText.expression);
            },
            function () {
                c.info("返答する");
                c.debug(response);
                message.channel.send(mm.replyeeString(replyeeId) + " " + response.systemText.expression);
            }
        ],
        function(err, result){
            if(err) throw err;
        });
    });
}
module.exports.startUp = start_repl_ai;
