const configs = require('./configs/bootload');
const ReplAI = require('./repl-ai');
const replAi = new ReplAI(configs.repl_ai.x_api_key, configs.repl_ai.bot_id, configs.repl_ai.init_topic_id);
const Datastore = require('nedb');
const Discord = require("discord.js");
const client = new Discord.Client();
const async = require("async");
const dateFormat = require("dateformat");


const db = new Datastore({
    filename: configs.repl_ai.db.user_info.path
});
const dialogueLog = new Datastore({
    filename: configs.repl_ai.db.dialogue_log.path
});

// ログイン準備
async.series([
    function (callback) {
        client.on("ready", callback);
    },
    function (callback) {
        info("ログインしました");
    }

], function(err, results) {
    if (err) throw err;

});

if (configs.bot.use_old) {
    const DocomoAPI = require('docomo-api'),
    api = new DocomoAPI(configs.docomo_api.api_key);
    client.on("message", (message) => {
        const replyeeId = message.author.id;
        if (message.content.startsWith("<@401712227561766933>")) {
            const re = /^<@401712227561766933> *(.*$)/i;
            const args = message.content.match(re) ? message.content.match(re)[1] : "";
            api.createDialogue(args, (error, data) => {
                console.log(`<:${args}\n>:${data.utt}\n`);
                message.channel.send(replyeeString(replyeeId) + " " + data.utt);
            });
        }
    });
}

if (!configs.bot.use_old) {
    // メッセージ受信時の処理
    client.on("message", (message) => {
        const replyeeId = message.author.id;
        let isInit = false;
        let response = {}; // createDialogueにて返却されたデータ

        if (!isSentTo(configs.bot.id, message)) return;
        const text = message.content.match(/(.*\d>|@everyone|@here)\s*(.*)$/)[2];

        async.waterfall([
            function(callback) {
                db.loadDatabase(callback);
            },
            function(callback) {
                db.findOne({id: replyeeId}, callback);
            },
            function(doc, callback) {
                info("知り合い？");
                debug(doc);
                if (!doc) {
                    info("知らない人");
                    isInit = true;
                    replAi.register(callback);

                } else {
                    info("知ってた");
                    isInit = false;
                    const data = {isInit: false, appUserId: doc.app_user_id};
                    callback(null, data);
                }
            },
            function (data, callback) {
                if (isInit) {
                    info("覚えた");
                    db.insert(initInsertDoc(replyeeId, data.appUserId), callback);
                } else {
                    callback(null, {app_user_id: data.appUserId});
                }
            },
            function (doc, callback) {
                debug("こう聞かれた");
                debug(":> " + text);
                const lastTalkedAt = dateFormat(doc.last_talked_at, "yyyy-mm-dd HH:MM:ss");
                replAi.createDialogue(doc.app_user_id, isInit, text, lastTalkedAt, callback);
            },
            function(data, callback) {
                response = data;
                info("最後の会話日時を記憶する");
                db.update({id: replyeeId}, {$set: {last_talked_at: new Date()}}, {}, callback)
                outputDialogueLog(dialogueLog, replyeeId, text, response.systemText.expression);
            },
            function () {
                info("返答する");
                debug(response);
                message.channel.send(replyeeString(replyeeId) + " " + response.systemText.expression);
            }
        ],
        function(err, result){
            if(err) throw err;
        });
    });
}

function initInsertDoc(discordId, appUserId)
{
    return {
          id             : discordId
        , first_talked_at: new Date()
        , last_talked_at : new Date()
        , app_user_id    : appUserId
    };
}
client.login(configs.bot.token);

function isFirstMet(id) {
    return true;
}

// 自分が呼ばれたかどうか
// @return boolean
function isSentTo (id, message)
{
	return (
		message.mentions.users.some(function(user){
			return 	user.id == id;
		})
		|| message.mentions.everyone
	);
}

// 返信対象者
// @return string <@[返信対象者ID]>
function replyeeString(replyeeId)
{
	return "<@" + replyeeId + ">";
}

// システム中断時（Ctrl + C）の処理
if (configs.bot.logout_sigint) {
    process.on("SIGINT", () => {
        debug("ログアウトします");
        client.destroy();
    });
}

// console.logのラッパー関数
function debug(debugMessage) {

    if (configs.bot.mode.debug) console.log(debugMessage);
}
// console.logのラッパー関数
function info(infoMessage) {
    const formattedMessage = "◆◆◆◆◆◆" + infoMessage + "◆◆◆◆◆◆";
    if (configs.bot.mode.info) console.log(formattedMessage);
}

function outputDialogueLog(logDb, discordId, requestMessage, responseMessage) {
    const doc = {
          dialogueCreated: new Date()
        , discordId: discordId
        , requestMessage: requestMessage
        , responseMessage: responseMessage
    };
    logDb.loadDatabase((err) => {
        if (err) {
            debug("ログ記載エラー");
            return;
        }
        logDb.insert(doc, (err, newDoc) => {
            if (err) {
                debug("ログ記載エラー")
                return;
            };
            debug(newDoc);
        });
    });


}
