const request = require('request-promise');
const _ = require('underscore');
const moment = require('moment');


var baseURL = "http://localhost:" + 3000;

/* Private functions */
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

function filterByMaxOccupancy (rooms, guests) {
	return rooms.filter((room) => room.maxOccupancy == guests);
}

/* The library */
function Hotel(hotelCode) {
	this.hotelCode = hotelCode;
	this.getRoomsURL = baseURL + "/hotel/" + this.hotelCode + "/info/rooms";
	this.availURL = baseURL + "/hotel/" + this.hotelCode + "/avail";

	return this;
}

Hotel.prototype.getRoom = function (roomTypeName) {
	return request.get({ url: this.getRoomsURL, json: true })
		.then((body) => body.guestRooms)
		.then(function (rooms) {
			// Switch to this on the actual api
			// var room = rooms.filter((room) => room.roomTypeName == roomTypeName);

			return rooms[0] || null;
		});
};


Hotel.prototype.getRooms = function (filters) {
	// If you are given dates use the availability API
	if (filters.dateIn) {
		// The API does not allow querying without a number of guests
		// so default to 1 guest (single rooms)
		var qs = {
			dateIn: filters.dateIn,
			dateOut: filters.dateOut || moment(filters.dateIn).add(1, 'days').format("YYYY-MM-DD"),
			adults: filters.guests || 1,
			rooms: 1
		};

		return request({ url: this.availURL, qs: qs, json: true })
			.then((body) => {
				console.log("room stays: ", body.roomStays);

				return body.roomStays[0].roomTypes;
			})
			.then(function (rooms) {

				if (filters.roomAmenities)
					rooms = filterByAmenities(rooms, filters.roomAmenities);

				return rooms;
			})
			.catch(function (err) {
				console.log("ERROR OCCURED IN GETROOMS 1!", err);
			});

	// Otherwise just fetch the rooms normally
	// and filter them
	} else {
		console.log(this.getRoomsURL);
		return request({ url: this.getRoomsURL, json: true })
			.then((body) => body.guestRooms)
			.then(function (rooms) {

				if (filters.roomAmenities)
					rooms = filterByAmenities(rooms, filters.roomAmenities);

				if (filters.guests)
					rooms = filterByMaxOccupancy(rooms, filters.guests);

				return rooms;
			})
			.catch(function (err) {
				console.log("ERROR OCCURED IN GETROOMS 2!", err);
			});
	}
};

module.exports = Hotel;