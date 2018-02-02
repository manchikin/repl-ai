const request = require('request');
const dateFormat = require('dateformat');
const configs = require('./configs/bootload');

const rep = class replAi {
    constructor(x_api_key, botId, init_topic_id) {
        this.headers = {
            'Content-Type':'application/json; charset=UTF-8',
            'x-api-key': x_api_key
        };
        this.options = {
            method: 'POST',
            headers: this.headers,
            json: true,
        };
        this.botId = botId;
        this.initTopicId = init_topic_id;

    }
    register(callback)
    {
        const url = "https://api.repl-ai.jp/v1/registration";
        const optionBody = {
            "botId": this.botId
        };

        const options = Object.assign({ url: url}, {body: optionBody}, this.options);
        if (configs.bot.mode.debug) console.log(options); //@TODO 削除予定
        request(options, function(error, response, body){

            if(response.statusCode !== 200){
                error = new Error(body);
            }
            callback(error, body || {});
        });
    }

    createDialogue(appUserId, isInit, voiceText, appRecvTime, callback)
    {
        const url = "https://api.repl-ai.jp/v1/dialogue";
        const optionBody = {
              appUserId: appUserId
            , botId: this.botId
            , voiceText: voiceText
            , initTalkingFlag: false
            , appRecvTime: isInit ? this.getNowDate() : appRecvTime
            , appSendTime: this.getNowDate()
        };
        let finalBody = Object.assign(optionBody, isInit ? {initTopicId: this.initTopicId} : {initTopicId: this.initTopicId} );
        const options = Object.assign({ url: url}, {body: optionBody}, this.options);
        if (configs.bot.mode.debug) console.log(options); //@TODO 削除予定
        request(options, function(error, response, body){

            if(response.statusCode !== 200){
                error = new Error(body);
            }
            callback(error, body || {});
        });
    }

    getNowDate()
    {
        const now = new Date();
        return dateFormat(now, "yyyy-mm-dd HH:MM:ss");
    }
};

module.exports = rep;
