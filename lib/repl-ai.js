const request = require('request');
const dateFormat = require('dateformat');
const configs = require('../configs/bootload');

const rep = class replAi {
    constructor(obj) {
        this.headers = {
            'Content-Type':'application/json; charset=UTF-8',
            'x-api-key': obj.x_api_key
        };
        this.options = {
            method: 'POST',
            headers: this.headers,
            json: true,
        };
        this.botId = obj.botId;

    }
    register(callback)
    {
        const url = "https://api.repl-ai.jp/v1/registration";
        const optionBody = {
            "botId": this.botId
        };

        const options = Object.assign({url: url}, {body: optionBody}, this.options);
        if (configs.bot.mode.debug) console.log(options); //@TODO 削除予定
        request(options, function(error, response, body){

            if(response.statusCode !== 200){
                error = new Error(body);
            }
            callback(error, body || {});
        });
    }

    createDialogue(obj, callback)
    {
        const url = "https://api.repl-ai.jp/v1/dialogue";
        const isInit = obj.voiceText === "init";
        const optionBody = {
              appUserId: obj.appUserId
            , botId: this.botId
            , voiceText: obj.voiceText
            , initTalkingFlag: isInit
            , appRecvTime: isInit ? this.getNowDate() : obj.appRecvTime
            , appSendTime: this.getNowDate()
        };
        if (isInit || obj.initTopicId) {
            if (isInit && !obj.initTopicId) throw "Need to set initTopicId";
            Object.assign(optionBody, {initTopicId: obj.initTopicId});
        }
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
