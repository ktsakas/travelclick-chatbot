const RoomAmenities = require('../apis/travelclick/room-amenities'),
	  HotelInfo = require('../apis/travelclick/hotel-info'),
	  Availability = require('../apis/travelclick/availability');

// Import parsers
var parsers = {
	book: require('./parsers/book'),
	availability: require('./parsers/availability'),
	hotelInfo: require('./parsers/hotelInfo'),
	directions: require('./parsers/directions'),
	roomInfo: require('./parsers/roomInfo'),
};

module.exports = function (chat) {
	return {
		availability: parsers.availability,

		book: function (text, context, entities) {
			return parsers.book(text, context, entities).then(function (context) {
				l.info("PARSED CONTEXT: ", context);
				
				return context;
			})
		},

		directions: parsers.directions,

		hotelInfo: parsers.hotelInfo,

		roomInfo: parsers.roomInfo,

		text: parsers.text
	};
};