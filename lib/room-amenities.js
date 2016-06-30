const request = require('request');
const _ = require('underscore');

var RoomAmenities = {
	port: process.env.PORT || 3000,

	getRooms: function (hotelCode, searchAmenity, cb) {
		var searchRegExp = new RegExp(searchAmenity, 'i');

		request.get({
			url : "http://localhost:" + this.port + "/hotel/" + hotelCode + "/info/rooms",
			// url: this.baseUrl + "hotel/" + hotelCode + "/info/rooms",
			options: {}
		}, function (err, res, body) {
			if (err) cb(err, false);
			else {
				var rooms = JSON.parse(body).guestRooms;

				rooms = _.filter(rooms, function (room) {
					return _.some(room.amenities, function (amenity) {
						return amenity.amenityName.match(searchRegExp);
					});
				});
				cb(null, rooms);
			}
		});
	},

	allHave: function (hotelCode, searchAmenity, cb) {
		var searchRegExp = new RegExp(searchAmenity, 'i');

		request.get({
			url : "http://localhost:9898/hotel/" + hotelCode + "/info/rooms",
			// url: this.baseUrl + "hotel/" + hotelCode + "/info/rooms",
			options: {}
		}, function (err, res, body) {
			console.log("guest rooms: ", body);

			if (err) cb(err, false);
			else {
				var rooms = JSON.parse(body).guestRooms;

				var has = _.some(rooms, function (room) {
					return _.some(room.amenities, function (amenity) {
						return amenity.amenityName.match(searchRegExp);
					});
				});
				cb(null, has);
			}
		});
	}	
};

module.exports = RoomAmenities;

