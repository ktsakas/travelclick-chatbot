const request = require('request-promise');
const _ = require('underscore');


function Rooms(roomsObj) {
	this.rooms = roomsObj;

}

Rooms.fuzzyMatch = function (str1, str2) {
	return str1.trim().toLowerCase() == str2.trim().toLowerCase();
};

Rooms.isSubarray = function (subarray, array) {

};

Rooms.haveAmenities = function (searchAmenities) {
	return this.rooms.filter(function (room) {
		var roomAmenities = _.pluck(room.amenities, 'amenityName');

		// Check the room has every amenity that the user wants
		return _(lowercase(searchAmenities)).every(
			(searchAmenity) => roomAmenities.indexOf(searchAmenity)
		);
	});
};

Rooms.haveMaxOccupancy = function (guests) {
	this.rooms = this.rooms.filter(function (room) {
		return room.maxOccupancy == guests;
	});
};

Rooms.areAvailable = function () {
	
};


function Hotel(hotelCode) {
	this.hotelCode = hotelCode;
	this.getRoomsURL =
		"http://localhost:" + this.port + "/hotel/" + this.hotelCode + "/info/rooms";

	return this;
}

Hotel.getRoom = function (roomTypeName) {
	return request.get({ url: this.getRoomsURL, json: true }).then(function (body) {
		return 
	});
};

function lowercase (array) {
	return array.map((str) => str.toLowerCase());
}

function filterByAmenities (rooms, searchAmenities) {
	return rooms.filter(function (room) {
		var roomAmenities = lowercase(_.pluck(room.amenities, 'amenityName'));

		// Check the room has every amenity that the user wants
		return _(lowercase(searchAmenities)).every(
			(searchAmenity) => roomAmenities.indexOf(searchAmenity)
		);
	});
}

function filterByRoomType (rooms, roomType) {
}

Hotel.getRooms = function (filters) {
	if (filter.roomType) {}

	if (filter.roomAmenities) {}

	request({ url: this.getRoomsURL, json: true }).then(function (body) {

		if (filters.roomAmenities)
			rooms = filterByAmenities(rooms, filter.roomAmenities);

		if (filters.roomType)
			rooms = filterByRoomType(rooms, filter.roomType);

		return rooms;
	});
};

module.exports.Hotel = Hotel;