function getMessage (text, textCommand) {
	var commandStart = text.indexOf(entities.textCommand);

	if (commandStart == -1) return null;
	else {
		var messageStart = commandStart + entities.textCommand.length;
		var message = text.substring(messageStart).trim();

		if (message.length <= 8) return null;
		else return message;
	}
}

module.exports = function (text, context, entities) {
	if (!context.askMessage) {
		var message = getMessage(text, entities.textCommand);

		if (message) context.message = message;
		else context.askMessage = true;

	} else {
		delete context.askMessage;

		context.message = text.trim();
	}

	return context;
};