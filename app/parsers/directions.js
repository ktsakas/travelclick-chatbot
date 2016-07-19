module.exports = function (text, context, entities) {
	delete context.askFromLocation;

	if (entities.location) {
		context.fromLocation = entities.location;
	}

	if (!context.fromLocation) {
		context.askFromLocation = true;
	}

	return context;
};