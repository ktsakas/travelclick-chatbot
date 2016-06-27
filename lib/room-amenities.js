const request = require('request');
const _ = require('underscore');

var RoomAmenities = {
	baseUrl: "http://ibeapil01-t5.ilcb.tcprod.local:8080/ibe/v1/",

	getRooms: function (hotelCode, searchAmenity, cb) {
		var searchRegExp = new RegExp(searchAmenity, 'i');

		request.get({
			url: this.baseUrl + "hotel/" + hotelCode + "/info/rooms",
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
			url: this.baseUrl + "hotel/" + hotelCode + "/info/rooms",
			options: {}
		}, function (err, res, body) {
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

