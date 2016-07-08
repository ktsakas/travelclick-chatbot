const RoomAmenities = require('../apis/travelclick/room-amenities.js'),
	  HotelInfo = require('../apis/travelclick/hotel-info.js'),
	  Availability = require('../apis/travelclick/availability.js'),
	  Parsers = require('./parsers');

module.exports = function (chat) {
	var parsers = new Parsers(chat);

	var actions = {
		say: function (answer) {
			chat.addMessage(answer);
		},

		merge: function (text, context, entities, cb) {
			console.log('merging: ', entities, context);

			if (entities.intent) {
				context[entities.intent] = true;
			}

			if (context.book) {
				context = parsers.book(text, context, entities);
			} else if (context.availability) {
				context = parsers.availability(text, context, entities);
			} else if (context.directions) {
				context = parsers.directions(text, context, entities);
			} else if (context.hotelInfo) {
				context = parsers.hotelInfo(text, context, entities);
			}

			console.log("BooK : ", context);

			cb(context);
		},

		book: function (context, cb) {
			console.log("book called", context);

			chat.addAnswer({
				type: 'redirect',
				url: "https://www.paypal.com"
			});

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
			console.log("availability context: ", context);

			if (!context.dateIn) {
				context.askDates = true;
				cb(context);
			} else if (!context.dateOut) {
				context.askDates = true;
				cb(context);
			} else if (!context.roomId) {
				context.askRoom = true;
				cb(context);
			} else {
				console.log("getting availability!");

				Availability.get(Availability.parseOptions(context), function (err, available) {
					chat.addMessage('Here is our availabilty: ');

					chat.addAnswer({
						type: 'availability',
						dates: available
					});

					delete context.dateIn;
					delete context.dateOut;
					delete context.availability;

					context.book = true;

					console.log("avail out: ", context);

					cb(context);
				});
			}
		},

		call: function (context, cb) {
			cb({});
		},

		showRooms: function (context, cb) {
			RoomAmenities.getRooms(1098, {
				amenity: context.roomAmenity,
				type: context.roomType
			}, function (err, rooms) {
				// console.log("rooms: ", rooms);

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

					// console.log("rooms: ", rooms);
					rooms = rooms.map(function (room) {
						var roomTypes = ['single', 'double', 'triple', 'quadruple'];

						return {
							roomId: room.id,
							roomTypeName: room.roomTypeName,
							roomType: roomTypes[ room.maxOccupancy - 1 ],
							maxOccupancy: room.maxOccupancy
						};
					});
					console.log("showing: ", rooms);

					if (!context.intent) {
						chat.addAnswer({
							type: "rooms",
							rooms: rooms,
							bookButton: true,
							availButton: true
						});
					} else {
						chat.addAnswer({
							type: "rooms",
							rooms: rooms,
							bookButton: false,
							availButton: false
						});
					}
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

		selectRoom: function (context, cb) {
			RoomAmenities.getRooms(1098, {
				amenity: context.roomAmenity,
				type: context.roomType
			}, function (err, rooms) {
				// console.log("rooms: ", rooms);
				rooms = rooms.map(function (room) {
					var roomTypes = ['single', 'double', 'triple', 'quadruple'];

					return {
						roomId: room.id,
						roomTypeName: room.roomTypeName,
						roomType: roomTypes[ room.maxOccupancy - 1 ],
						maxOccupancy: room.maxOccupancy
					};
				});

				chat.addAnswer({
					type: "rooms",
					rooms: rooms,
					selectable: true,
					bookButton: false,
					availButton: false
				});

				cb(context);
			});
		},

		hotelInfo: function (context, cb) {
			HotelInfo.getInfo(1098, context.hotelInfo, function (err, value) {
				var response = { type: "msg" };

				if (context.hotelInfo == "phone") {
					response.text = "Our phone number is " + value;
				} else if (context.hotelInfo == "fax") {
					response.text = "Our fax is " + value;
				} else if (context.hotelInfo == "checkIn") {
					response.text = "Check in time is " + value;
				} else if (context.hotelInfo == "checkOut") {
					response.text = "Check out time is " + value;
				}

				chat.addAnswer(response);

				cb({});
			});
		},

		text: function (context, cb) {
			cb({});
		},

		stop: function (context, cb) {
			console.log("STOPPED ACTION CALLED!");
			chat.emit('respond', chat.popUnsent());
		}
	};

	return actions;
};