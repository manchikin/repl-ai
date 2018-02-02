const configs = require('../configs/bootload');

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

function initInsertDoc(discordId, appUserId)
{
    return {
          discord_id     : discordId
        , first_talked_at: new Date()
        , last_talked_at : new Date()
        , app_user_id    : appUserId
    };
}


module.exports.isSentTo = isSentTo;
module.exports.replyeeString = replyeeString;
module.exports.initInsertDoc = initInsertDoc;
