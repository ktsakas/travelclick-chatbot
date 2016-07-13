const request = require('request-promise');
const _ = require('underscore');

function Rooms(hotelCode) {
	this.hotelCode = hotelCode;

	return this;
}

Rooms.getRoom = function (roomTypeName) {
	return request.get({
		url : "http://localhost:" + this.port + "/hotel/" + this.hotelCode + "/info/rooms",
		json: true
	}).then(function (body) {
		return 
	});
};

Rooms.filter = function (filters) {
	if (filter.roomType) {}

	if (filter.roomAmenities) {}
};

module.exports.getRooms = ;