module.exports = function (text, context, entities) {
	context.hotelInfoName = entities.hotelInfo;

	return context;
};