const RoomAmenities = require('../apis/travelclick/room-amenities.js'),
	  HotelInfo = require('../apis/travelclick/hotel-info.js'),
	  Availability = require('../apis/travelclick/availability.js');

module.exports = function (chat) {
	return {
		say: function (answer) {
			chat.addMessage(answer);
		},

		merge: function (context, cb) {
			console.log('merging: ', entities, context);

			if (context.availSuccess) {
				context = {
					askDateIn: true,
					roomType: context.roomType,
					guests: context.guests
				};
			}

			cb(context);
		},

		book: function (context, cb) {
			console.log("book called", context);

			if (!context.dateIn) context.askDateIn = true;
			else if (!context.dateOut) context.askNights = true;
			else if (!context.guests) context.askGuests = true;
			else {
				chat.addAnswer({
					type: 'redirect',
					url: "https://www.paypal.com"
				});

				context.bookSuccess = true;
			}

			cb(context);
		},

		location: function (context, cb) {
			HotelInfo.getInfo(1098, 'position', function (err, pos) {
				chat.addMessage("Our address is 1 Jenkin Street");

				chat.addAnswer({
					type: "location",
					location: {
						lat: parseFloat(pos.latitude),
						lng: parseFloat(pos.longitude)
					}
				});

				cb({});
			});
		},

		directions: function (context, cb) {
			context = chat.parseDirections(context, entities, cb);

			if (!context.fromLocation) {
				context.askFromLocation = true;

				cb(context);
			} else {
				context.success = true;

				chat.addAnswer({
					type: 'directions',
					origin: "JFK Airport",
					dest: {
						lat: 37.8386741,
						lng: -122.2936934
					}
				});

				cb(context);
			}
		},

		availability: function (context, cb) {
			console.log("avail: ", entities);
			context = chat.parseAvailability(context, entities, cb);
			
			if (!context.dateIn) {
				context.askDates = true;
				cb(context);
			} else if (!context.dateOut) {
				context.askDates = true;
				cb(context);
			} else if (!context.roomType) {
				context.askRoomType = true;
				cb(context);
			} else {
				console.log("getting availability!");

				Availability.get(Availability.parseOptions(context), function (err, available) {
					// console.log("available: ", available);

					chat.addMessage('Here is our availabilty: ');

					chat.addAnswer({
						type: 'availability',
						dates: available
					});

					/*chat.addAnswer({
						type: 'prompt',
						text: 'Would you like to book a ' + context.roomType + '?',
						equiv: 'I would like to book a single.'
					});*/

					context = {
						availSuccess: true,
						dateIn: "2016-10-10",
						dateOut: "2016-14-10",
						roomType: "single",
						guests: 1
					};

					cb(context);
				});
			}
		},

		call: function (context, cb) {
			chat.addAnswer({
				type: "msg",
				text: "Calling the hotel..."
			});

			cb({});
		},

		showRooms: function (context, cb) {
			RoomAmenities.getRooms(1098, {
				amenity: context.roomAmenity,
				type: context.roomType
			}, function (err, rooms) {
				console.log(context);

				if (rooms.length >= 0) {
					if (context.roomAmenity && context.roomType) {
						chat.addMessage(
							"Here are all our " + context.roomType + " with " + context.roomAmenity
						);
					} else if (context.roomType) {
						chat.addMessage(
							"Here are all our " + context.roomType
						);
					} else if (context.roomAmenity) {
						chat.addMessage(
							"Here are all our rooms with " + context.roomAmenity + "."
						);
					}

					rooms = rooms.map(function (room) {
						room.roomId = room.id;
						return room;
					});

					chat.addAnswer({
						type: "rooms",
						rooms: rooms,
						action: context.intent,
						bookButton: true,
						availButton: true
					});
				} else {
					var roomType = context.roomType || "room";
					var amenitySuffix = context.roomAmenity ? " with " + context.roomAmenity : "";

					chat.addMessage(
						"Unfortunately, we don't have any " + roomType + amenitySuffix + "."
					);
				}

				cb(context);
			});
		},

		hotelInfo: function (context, cb) {
			entities = chat.normalize(entities);
			console.log("hotelInfo: ", entities);

			HotelInfo.getInfo(1098, entities.hotelInfo, function (err, value) {
				var response = { type: "msg" };

				if (entities.hotelInfo == "phone") {
					response.text = "Our phone number is " + value;
				} else if (entities.hotelInfo == "fax") {
					response.text = "Our fax is " + value;
				} else if (entities.hotelInfo == "checkIn") {
					response.text = "Check in time is " + value;
				} else if (entities.hotelInfo == "checkOut") {
					response.text = "Check out time is " + value;
				}

				chat.addAnswer(response);

				cb({});
			});
		},

		text: function (context, cb) {
			/*if (context == 'yes') {
				chat.addMessage("Text sent successfully.");
			} else {
				chat.addMessage("Ok, I will not text the hotel.");
			}*/

			cb({});
		},

		stop: function (context, cb) {
			console.log("STOPPED ACTION CALLED!");
			chat.emit('respond', chat.popUnsent());
		}
	};
};