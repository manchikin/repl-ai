const AffixManager = require('../lib/repl-ai/affix-manager');
const fs = require("fs");
const response = fs.readFileSync('test/repl-ai/repl-ai-response.txt', 'utf8');

// console.log("response:", response);
const last_suffix_data = response.split("###")[1];
console.log(last_suffix_data);
const data = {
    "favorability": 20
    , "last_suffix_data": last_suffix_data
};
const af = new AffixManager(data);
const suffix = af.getSuffixDataOf(response);
// DBにここで入れる
console.log("suffix:", suffix);
console.log("JSON", af.json);

const res = af.getPrefix();
console.log("◆◆◆◆request prefix:◆◆◆◆");
console.log(res);
