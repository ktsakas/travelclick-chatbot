const request = require('request-promise'),
	  _ = require('underscore'),
	  moment = require('moment');

var baseURL = "http://localhost:" + 3000;

/**
 * Utility function that converts all strings in an array to lowercase.
 * 
 * @private
 * @param  {array} array
 * @return {array} updated array
 */
function lowercase (array) {
	return array.map((str) => str.toLowerCase());
}

/**
 * Filters a list of rooms based on a list of required amenities.
 *
 * @private
 * @param  {array} rooms - A list of rooms.
 * @return {array} searchAmenities - The amenities they must have.
 */
function filterByAmenities (rooms, searchAmenities) {
	return rooms.filter(function (room) {
		var roomAmenities = lowercase(_.pluck(room.amenities, 'amenityName'));

		// Check the room has every amenity that the user wants
		return _(lowercase(searchAmenities)).every(
			(searchAmenity) => roomAmenities.indexOf(searchAmenity)
		);
	});
}

/**
 * Filters a list of rooms based on a list of required amenities.
 * 
 * @private
 * @param  {array} rooms - A list of rooms.
 * @return {array} searchAmenities - The amenities they must have.
 */
function filterByMaxOccupancy (rooms, guests) {
	return rooms.filter((room) => room.maxOccupancy == guests);
}

/**
 * Reprsents a hotel.
 * 
 * @constructor
 * @param {number} hotelCode - The ID of the hotel.
 */
function Hotel(hotelCode) {
	this.hotelCode = hotelCode;
	this.getRoomsURL = baseURL + "/hotel/" + this.hotelCode + "/info/rooms";
	this.availURL = baseURL + "/hotel/" + this.hotelCode + "/avail";

	return this;
}

/**
 * Returns a specific room of the hotel by name.
 * 
 * @param {number} roomTypeName - The name of the room.
 * @return {object} The room mached or null.
 */
Hotel.prototype.getRoom = function (roomTypeName) {
	return request.get({ url: this.getRoomsURL, json: true })
		.then((body) => body.guestRooms)
		.then(function (rooms) {
			// Switch to this on the actual api
			// var room = rooms.filter((room) => room.roomTypeName == roomTypeName);

			return rooms[0] || null;
		});
};

/**
 * Returns all rooms matching a set of filters.
 * The filters can be dateIn, dateOut, roomAmenities, guests.
 * 
 * @param {object} filters
 * @return {object} The room mached or null.
 */
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