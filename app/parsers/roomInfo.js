module.exports = function (text, context, entities) {
	if (entities.roomAmenity) {
		context.roomAmenity = entities.roomAmenity;
	}

	return context;
};