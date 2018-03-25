const configs = require('../configs/bootload');
const MorphemeAnalyzer = require('../main/repl-ai/morpheme-analyze');

const args = process.argv.slice(2)
const text      = args[0];

const favorability = 20;
const ma = new MorphemeAnalyzer(text, {favorability: favorability});
console.log("#######RESULT##########\n" + ma.getText() + "\n#######################");
