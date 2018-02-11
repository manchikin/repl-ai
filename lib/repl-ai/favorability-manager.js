const c = require('../console');
const fs = require("fs");
const configs = require('../../configs/bootload');

class FavorabilityManager
{
    static getPlusFavorabilityPerTalk(nowFav)
    {
        if (nowFav > configs.repl_ai.status.favorability.max_value) return 0;
        return configs.repl_ai.status.favorability.increment_per_talk;
    }
}


module.exports = FavorabilityManager;
