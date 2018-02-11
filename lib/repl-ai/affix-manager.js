const c = require('../console');
const fs = require("fs");
const defaultTimeList = JSON.parse(fs.readFileSync('configs/repl-ai/default-time.json', 'utf8'));
const MAA = require('../morphological-analysis-api');
const dateFormat = require('dateformat');

class AffixManager
{
    constructor(dbUserData)
    {
        this.none = "X";
        this.replyeeData = dbUserData;
        const suffix = dbUserData.last_suffix_data;
        try {
            console.log("last_suffix_data: ", suffix);
            this.json = suffix ? JSON.parse(suffix) : {};
            this.nextPrefixParams = this.json.hasOwnProperty("next_prefix") ? this.json.next_prefix : {};
            console.log(this.json);
            this.usePrefix =  this._usePrefix(this.nextPrefixParams);
        } catch (e) {
            c.log("last_suffix_dataのJSONパースに失敗しました", "debug");
            c.log(e, "debug");
            this.json = {};
            this.usePrefix = false;
        }
    }

    _usePrefix(nextPrefixParams)
    {
        const shouldPutPrefixList = ["time", "favorability", "word", "random"];
        for (const p in shouldPutPrefixList) {
            if (nextPrefixParams.hasOwnProperty(shouldPutPrefixList[p])) return true;
        };
        return false;
    }

    getPrefix()
    {
        console.log("prefixを付けるか？" + this.usePrefix);
        if (!this.usePrefix) return "";
        let request = "";
        for (const key in this.json.order) {
            switch(this.json.order[key]) {
                case "time":
                    request += this._getTime(this.nextPrefixParams);
                    break;
                case "favorability":
                    request += this._getFav(this.nextPrefixParams);
                    break;
                case "word":
                    request += this._getWord(this.nextPrefixParams);
                    break;
                case "random":
                    request += this._getRandom(this.nextPrefixParams);
                    break;
                default:
                    console.log("無効な値がorderに指定されています。");
            }
        };
        request = request.concat(";");
        return request;
    }

    getSuffixDataOf(response)
    {
        let ret = {};
        console.log(response);
        const separator = "###";
        // return value 初期化
        ret.responseText = response;
        ret.updateFavorability = this.replyeeData.favorability;
        ret.suffixString = response.split(separator)[1] || false;

        if (!ret.suffixString) {
            console.log("suffixが存在しない");
            console.log("ret.updateFavorability: " + ret.updateFavorability);
            return ret;
        }

        ret.responseText = response.split(separator)[0];
        try {
            console.log("suffix存在確認:");
            console.log(ret.suffixString);
            const resJson = JSON.parse(ret.suffixString);
            console.log("resJson", resJson);
            if (resJson.hasOwnProperty('feedback') && resJson.feedback.hasOwnProperty('favorability')) {
                console.log("favorability計算");
                try {
                    ret.updateFavorability = eval(this.replyeeData.favorability + resJson.feedback.favorability);
                } catch (e) {
                    console.log("favorability計算エラー：" + this.replyeeData.favorability + resJson.feedback.favorability);
                }
                console.log("ret.updateFavorability: " + ret.updateFavorability);
            };
        } catch (e) {
            c.log("レスポンスのJSONパースに失敗しました", "debug");
            c.log(e, "debug");
        }
        return ret;
    }

    _getTime(nextPrefixParams)
    {
        console.log("time計測開始");
        if (!nextPrefixParams.hasOwnProperty('time')) return this.none;
        const time = nextPrefixParams.time;
        const now = new Date();
        const nowDateTime = parseInt(dateFormat(now, "yyyymmddHHMMss"));
        console.log("NOW: " + nowDateTime);
        for (const key in time) {
            console.log("key: " + key);
            let datetimeList = [];
            switch(time[key].type) {
                case 'direct':
                    datetimeList = time[key].value;
                    break;
                case 'default':
                    for (const n in defaultTimeList[time[key].value]) {
                        console.log(defaultTimeList[time[key].value][n]);
                        datetimeList[n] = defaultTimeList[time[key].value][n].slice();

                    }
                    // datetimeList = defaultTimeList[time[key].value].concat();
                    break;
                default:
            }

            for (const i in datetimeList) {
                for (const j in datetimeList[i]) {
                    if (!datetimeList[i][j] == "****-**-** **:**:**") datetimeList[i][j] = "9999-12-31 23:59:59";
                    datetimeList[i][j] = datetimeList[i][j].replace(/^\*\*\*\*/, dateFormat(now, "yyyy"));
                    datetimeList[i][j] = datetimeList[i][j].replace(/-\*\*-/, "-" + dateFormat(now, "mm") + "-");
                    datetimeList[i][j] = datetimeList[i][j].replace(/-\*\*/, "-" + dateFormat(now, "dd"));
                    datetimeList[i][j] = datetimeList[i][j].replace(/\s\*\*/, " " + dateFormat(now, "HH"));
                    datetimeList[i][j] = datetimeList[i][j].replace(/:\*\*:/, ":" + dateFormat(now, "MM") + ":");
                    datetimeList[i][j] = datetimeList[i][j].replace(/:\*\*$/, ":" + dateFormat(now, "ss"));
                    datetimeList[i][j] = parseInt(datetimeList[i][j].replace(/(?:\s|-|:)/g, "").replace(/\*/g, 0));
                }
                datetimeList[i].sort();
                console.log("datetimeList[i]: " + datetimeList[i]);
                console.log("NOW: " + nowDateTime);
                if (nowDateTime > datetimeList[i][0] && nowDateTime < datetimeList[i][1]) {
                    console.log("適合");
                    console.log("key: " + key);
                    return key;
                }
            }
        }
        return this.none;
    }
    _getFav(nextPrefixParams)
    {
        if (!nextPrefixParams.hasOwnProperty('favorability')) return this.none;
        console.log("fav計測開始");
        const fav = nextPrefixParams.favorability;
        const userFav = this.replyeeData.favorability;
        console.log("発話者favorability: " + userFav);
        console.log(fav);
        for (const key in fav) {
            if (fav[key].hasOwnProperty("from") && fav[key].hasOwnProperty("to")) {
                if (userFav >= fav[key].from && userFav <= fav[key].to)  return key;
            }
            if (fav[key].hasOwnProperty("from") && !fav[key].hasOwnProperty("to")) {
                if (userFav >= fav[key].from)  return key;
            }
            if (!fav[key].hasOwnProperty("from") && fav[key].hasOwnProperty("to")) {
                if (userFav <= fav[key].to)  return key;
            }
        }
        return this.none;
    }
    _getWord(nextPrefixParams)
    {
        return this.none; //@TODO 現在未実装
        const text = "冬が好きです";
        if (!nextPrefixParams.hasOwnProperty('word')) return this.none;
        console.log("word計測開始");
        const word = nextPrefixParams.word;
        console.log(word);
        const maa = new MAA();
        const separatedWords = maa.getWords(text);
        for (const key in word) {
            let result = {};
            result.include = false;
            result.exclude = true;
            console.log("◆data: ");
            console.log(word[key]);
            for (const condition in word[key]) {
                console.log("condition: " + condition);
                console.log(separatedWords);
                switch (condition) {
                    case 'exclude':
                        for (const i in separatedWords) {
                            console.log(separatedWords[i]);
                            console.log("word.key.condition: " + word[key][condition]);
                            if (word[key][condition].includes(separatedWords[i])) {
                                result.exclude = false;
                                break;
                            }
                            console.log("exlude result :" + result.exclude);
                        }
                        break;
                    case 'include':
                        for (const i in separatedWords) {
                            if (word[key][condition].includes(separatedWords[i])) result.include = true;
                        }
                        break;
                    default:
                }
                if (!result.include || !result.exclude) break;
            }
            if (result.exclude && result.include) return key;
        }
        return this.none;
    }

    _getRandom(nextPrefixParams)
    {
        console.log("random計測開始");
        if (!nextPrefixParams.hasOwnProperty('random')) return this.none;
        const random = nextPrefixParams.random;
        console.log("random:");
        console.log(random);
        const baseRandomNumber =  Math.floor(Math.random() * (random.to - random.from + 1) + random.from);
        console.log("baseRandomNumber: " + baseRandomNumber);
        for (const key in random) {
            // ベースの設定値の場合は計算しない
            if (key == "from" || key == "to") continue;
            const keyData = random[key];
            if (keyData.hasOwnProperty('from') && keyData.hasOwnProperty('to')) {
                if (keyData.from <= baseRandomNumber && baseRandomNumber <= keyData.to) return key;
            }
            if (keyData.hasOwnProperty('from') && !keyData.hasOwnProperty('to')) {
                if (keyData.from <= baseRandomNumber) return key;
            }
            if (!keyData.hasOwnProperty('from') && keyData.hasOwnProperty('to')) {
                if (baseRandomNumber <= keyData.to) return key;
            }
        }

        return this.none;
    }
}


module.exports = AffixManager;
