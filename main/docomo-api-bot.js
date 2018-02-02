const DocomoAPI = require('docomo-api');
const configs = require('../configs/bootload');
const mm = require('./lib/message-manager');

function start_docomo_api(client) {
    client.on("message", (message) => {
        const api = new DocomoAPI(configs.docomo_api.api_key);
        const replyeeId = message.author.id;
        if (message.content.startsWith("<@" + configs.bot.id + ">")) {
            const re = new RegExp('\s*<@' + configs.bot.id + '>\s*(.*$)', 'i');
            const args = message.content.match(re) ? message.content.match(re)[1] : "";
            api.createDialogue(args, (error, data) => {
                console.log(`<:${args}\n>:${data.utt}\n`);
                message.channel.send(mm.replyeeString(replyeeId) + " " + data.utt);
            });
        }
    });
}

module.exports.startUp = start_docomo_api;
