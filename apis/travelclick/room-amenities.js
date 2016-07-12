const request = require('request-promise');
const _ = require('underscore');

var RoomAmenities = {
	port: process.env.PORT || 3000,

	promiseGetRoom: function (hotelCode, roomId) {
		return request.get({
			url : "http://localhost:" + this.port + "/hotel/" + hotelCode + "/info/rooms",
			json: true
		}).then(function (body) {
			// Filter rooms by id
			return _(body.guestRooms).filter((room) => room.id == roomId);
		});
	},

	getRoom: function (hotelCode, roomId, cb) {
		request.get({
			url : "http://localhost:" + this.port + "/hotel/" + hotelCode + "/info/rooms",
			// url: this.baseUrl + "hotel/" + hotelCode + "/info/rooms",
			options: {}
		}, function (err, res, body) {
			if (err) cb(err, false);
			else {
				// console.log("gotten room");

				var rooms = JSON.parse(body).guestRooms;

				rooms = _.filter(rooms, function (room) {
					return room.id == roomId;
				});

				cb(null, rooms[0]);
			}
		});
	},

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
			url : "http://localhost:" + this.port + "/hotel/" + hotelCode + "/info/rooms",
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

/*RoomAmenities.promiseGetRoom(1098, 1535).then(function (rooms) {
	console.log(rooms);
});*/

module.exports = RoomAmenities;

