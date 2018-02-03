const DocomoAPI = require('docomo-api');
const configs = require('../configs/bootload');
const async = require("async");
const MessageManager = require('../lib/message-manager');
const mm = new MessageManager();
const api = new DocomoAPI(configs.docomo_api.api_key);

function start_docomo_api(message) {
    const replyeeId = message.author.id;
    async.waterfall([
        (callback) => {
            const re = new RegExp('\s*<@' + configs.bot.id + '>\s*(.*$)', 'i');
            const args = message.content.match(re) ? message.content.match(re)[1] : "";
            api.createDialogue(args, (error, data) => {
                console.log(`<:${args}\n>:${data.utt}\n`);
                message.channel.send(mm.replyeeString(replyeeId) + " " + data.utt);
            });
        }
    ], (err, result) => {
        if (err) throw err;
    });
}

module.exports.startUp = start_docomo_api;
