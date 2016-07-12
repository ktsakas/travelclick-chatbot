const request = require('request-promise');
const _ = require('underscore');

function TravelClickAPI(hotelCode) {
	return 1;
}

TravelClickAPI.getRooms = function () {
	return request.get({
		url : "http://localhost:" + this.port + "/hotel/" + hotelCode + "/info/rooms",
		json: true
	});
};

module.exports.getRooms = ;