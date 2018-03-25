const configs = require('../../configs/bootload');
const fs = require("fs");
const el = JSON.parse(fs.readFileSync('configs/main/morpheme.json', 'utf8'));
const favRank = JSON.parse(fs.readFileSync('configs/repl-ai/default-favorability-rank.json', 'utf8'));

class MorphemeAnalyzer
{
    constructor(userText, userData)
    {
        this.userData = userData;
        this.userText = userText ? userText : "";
        this.result = {
              text       : ""
            , scenarioId : ""
        };
        this.execute();
    }

    execute()
    {
        if (this.userText === "") return el.default_word;
        const keyOfList =  this._getWord(this.userText);

        if (keyOfList === el.default_word) {
            // 抽出できなかった場合はデフォルト値返却
            this.result.text = el.default_word;
            return;
        }

        // 以下、抽出した場合
        // 1. シナリオID付与
        // 2. 条件がある場合、textに指定値をappend
        if (el.word[keyOfList].hasOwnProperty("scenario_id") && el.word[keyOfList].scenario_id !== "")
        {
            this.result.scenarioId = el[keyOfList].scenario_id;
        }

        let append = "";
        if (el.word[keyOfList].hasOwnProperty("if")) {
            append = this._getAppendStringOfIf(el.word[keyOfList].if);
        }

        this.result.text = keyOfList + append;

    }

    getText()
    {
        return this.result.text;
    }

    getScenarioId()
    {
        return this.result.scenarioId;
    }

    _getAppendStringOfIf(ifs) {
        let returnStr = "";
        for (const i in ifs) {
            returnStr += el.delimiter;

            // if の 対象キーを取得
            // 例えば if [{"favorability": {"range": "love"}}] のとき
            // "favorability"の部分
            const key = Object.keys(ifs[i])[0]
            const value = ifs[i][key];
            switch (key) {
                case "favorability":
                    returnStr += this._calcFavorability(value);
                    break;
                case "datetime":
                    returnStr += this._calcDatetime(value);
                    break;
                default:
                    throw "Invalid Key in 'If List'";
            }
        }
        return returnStr;

    }
    _calcFavorability(condition)
    {
        for (const fav in favRank) {
            switch (condition.type) {
                case "default_all":
                //@TODO favorabilityManagerを作成
                    break;
                case "default":
                    break;
                case "direct":
                    console.log("未実装");
                    break;
            }
            console.log(fav);

        }
        return "favo";
    }



    _calcDatetime()
    {
        return "date";
    }

    _getWord(text)
    {
        for (const key in el.word) {
            // 完全一致検索
            if (el.word[key].same.includes()) return key;

        }

        for (const key in el.word) {
            // 部分一致検索
            for (const p in el.word[key].partial) {
                if (text.indexOf(el.word[key].partial[p]) > -1) return key;
            }

        }

        // 一致無し
        return el.default_word;
    }
}

module.exports = MorphemeAnalyzer;
