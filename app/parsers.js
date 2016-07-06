const RoomAmenities = require('../apis/travelclick/room-amenities.js'),
	  HotelInfo = require('../apis/travelclick/hotel-info.js'),
	  Availability = require('../apis/travelclick/availability.js');

var moment = require('moment');

module.exports = {
	merge: function (text, context, entities, cb) { cb(context); },


	availability: function (text, context, entities, cb) {
		if (entities.intent) context.intent = entities.intent;
		// console.log("availability with equiv: ", entities, this.equiv);

		if (!entities.roomName && !context.roomName) {
			entities.roomName = this.text.split("\"")[1];
		}

		if (entities.roomName) context.roomName = entities.roomName;
		if (entities.roomId) context.roomId = entities.roomId;
		if (entities.roomType) context.roomType = entities.roomType;

		entities.nights = entities.number;
		entities.guests = entities.number;

		delete context.askDates;
		delete context.askRoomType;

		if (!context.dateIn) {
			// if (entities.dates.length == 0) this.addMessage("I expected a date. Could you repeat that?");

			if (entities.dates && entities.dates[0]) context.dateIn = entities.dates[0];
			if (entities.dates && entities.dates[1]) context.dateOut = entities.dates[1];
		} else if (!context.dateOut) {
			if (entities.dates.length > 0) {
				context.dateOut = entities.dates[0];
			} else if (entities.nights) {
				context.dateOut = moment(context.dateIn).add(1, 'months').subtract(1, 'days').format('YYYY-MM-DD');
			}
		} else if (!context.guests) {
			if (entities.guests) {
				context.guests = entities.guests;

				var roomTypes = ['single', 'double', 'triple'];
				context.roomType = roomTypes[ context.guests - 1 ];
			} else if (entities.roomType) {
				context.roomType = entities.roomType;

				if (context.roomType == 'single') {
					context.guests = 1;
				} else if (context.roomType == 'double') {
					context.guests = 2;
				} else if (context.roomType == 'triple') {
					context.guests = 3;
				}
			}
			
			/*if (!entities.guests) {
				this.addMessage("I expected the number of guests. Could you repeat that?")
			}*/
		}

		cb(context);
	},


	book: function (text, context, entities, cb) {
		if (entities.intent) context.intent = entities.intent;
		if (entities.roomName) context.roomName = entities.roomName;
		if (entities.roomId) context.roomId = entities.roomId;

		console.log("book: ", entities);

		delete context.askDateIn;
		delete context.askNights;
		delete context.askRoom;

		entities.nights = entities.number;
		entities.guests = entities.number;

		if (!context.dateIn) {
			// if (entities.dates.length == 0) this.addMessage("I expected a date. Could you repeat that?");

			if (entities.dates && entities.dates[0]) context.dateIn = entities.dates[0];
			if (entities.dates && entities.dates[1]) context.dateOut = entities.dates[1];
		} else if (!context.dateOut) {
			if (entities.dates && entities.dates.length > 0) {
				context.dateOut = entities.dates[0];
			} else if (entities.nights) {
				context.dateOut = moment(context.dateIn).add(1, 'months').subtract(1, 'days').format('YYYY-MM-DD');
			}/* else {
				this.addMessage("I didn't get that. How many nights are you staying?");
			}*/
		} else if (!context.guests) {
			context.guests = entities.guests;

			/*if (!entities.guests) {
				this.addMessage("I expected the number of guests. Could you repeat that?")
			}*/
		}

		cb(context);
	},


	showRooms: function (text, context, entities, cb) {
		console.log("parsing room info: ", entities);

		if (entities.roomAmenity) {
			context.roomAmenity = entities.roomAmenity;
		}

		cb(context);
	},

	directions: function (text, context, entities, cb) {
		delete context.askFromLocation;

		if (entities.location) {
			context.fromLocation = entities.location;
		}

		cb(context);
	},

	hotelInfo: function (text, context, entities, cb) {
		context.hotelInfo = entities.hotelInfo;

		cb(context);
	}
};