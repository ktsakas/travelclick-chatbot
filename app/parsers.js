const RoomAmenities = require('../apis/travelclick/room-amenities.js'),
	  HotelInfo = require('../apis/travelclick/hotel-info.js'),
	  Availability = require('../apis/travelclick/availability.js');

var moment = require('moment');

module.exports = function (chat) {
	return {
		availability: function (text, context, entities) {
			if (!entities.roomTypeName && !context.roomTypeName) {
				entities.roomTypeName = this.text.split("\"")[1];
			}

			if (entities.roomTypeName) context.roomTypeName = entities.roomTypeName;
			if (entities.roomId) context.roomId = entities.roomId;
			if (entities.roomType) context.roomType = entities.roomType;

			entities.nights = entities.number;
			entities.guests = entities.number;

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

			console.log("avail ctx: ", context);

			return context;
		},


		book: function (text, context, entities) {
			if (entities.roomTypeName) context.roomTypeName = entities.roomTypeName;
			if (entities.roomId) context.roomId = entities.roomId;

			console.log("book: ", entities);

			entities.nights = entities.number;
			entities.guests = entities.number;

			delete context.askDateIn;
			delete context.askNights;
			delete context.askRoom;

			if (!context.dateIn) {
				// if (entities.dates.length == 0) this.addMessage("I expected a date. Could you repeat that?");

				if (entities.dates && entities.dates[0]) context.dateIn = entities.dates[0];
				if (entities.dates && entities.dates[1]) context.dateOut = entities.dates[1];
			} else if (!context.dateOut) {

				if (entities.dates && entities.dates.length > 0) {
					context.dateOut = entities.dates[0];
				} else if (entities.nights) {
					console.log("MISSING DATE OUT!", entities.nights, context.dateIn);

					context.dateOut = moment(context.dateIn).add(entities.nights, 'days').format('YYYY-MM-DD');
				
					console.log("FILLED DATE OUT!", context.dateOut);
				}/* else {
					this.addMessage("I didn't get that. How many nights are you staying?");
				}*/
			} else if (!context.guests) {
				context.guests = entities.guests;

				/*if (!entities.guests) {
					this.addMessage("I expected the number of guests. Could you repeat that?")
				}*/
			}

			if (!context.dateIn) context.askDateIn = true;
			else if (!context.dateOut) context.askNights = true;
			else if (!context.roomId) context.askRoom = true;

			return context;
		},

		directions: function (text, context, entities) {
			delete context.askFromLocation;

			if (entities.location) {
				context.fromLocation = entities.location;
			}

			return context;
		},

		hotelInfo: function (text, context, entities) {
			context.hotelInfo = entities.hotelInfo;

			return context;
		}
	};
};