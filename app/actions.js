const RoomAmenities = require('../apis/travelclick/room-amenities.js'),
	  HotelInfo = require('../apis/travelclick/hotel-info.js'),
	  Availability = require('../apis/travelclick/availability.js'),
	  Parsers = require('./parsers');

var Promise = require('bluebird');

function changeIntent () {

}

module.exports = function (chat) {
	var parsers = new Parsers(chat);

	var actions = {
		say: function (body) {
			chat.addMessage(body.msg);

			if (body.quickreplies) chat.addAnswer({ type: 'yes_no' });

			/*delete context.askHelp;
			delete context.unknown;

			cb(context);*/
		},

		merge: function (text, context, entities, cb) {
			console.log('merging: ', text, entities, context);

			if (entities.intent && !context[entities.intent]) {
				context[entities.intent] = true;
				delete entities.intent;

				entities.newCommand = true;
			}

			var p;
			if (context.book) {
				p = parsers.book(text, context, entities);
			} else if (context.availability) {
				p = parsers.availability(text, context, entities);
			} else if (context.directions) {
				p = Promise.resolve( parsers.directions(text, context, entities) );
			} else if (context.hotelInfo) {
				p = Promise.resolve( parsers.hotelInfo(text, context, entities) );
			} else if (context.roomInfo) {
				p = Promise.resolve( parsers.roomInfo(text, context, entities) );
			} else if (context.text) {
				p = Promise.resolve( parsers.text(text, context, entities) );
			} else if (context.askHelp) {
				delete context.askHelp;
				p = Promise.resolve(context);
			} else {
				context.unknown = true;
				p = Promise.resolve(context);
			}

			p.then(function (context) {
				console.log("MERGED: ", context);

				return context;
			}).then((context) => cb(context));
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
			console.log("CALLING DIRECTIONS!\n");

			chat.addAnswer({
				type: 'directions',
				origin: "JFK Airport",
				dest: {
					lat: 37.8386741,
					lng: -122.2936934
				}
			});

			delete context.directions;
			delete context.fromLocation;

			context.askHelp = true;
			cb(context);
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
					console.log("Have many rooms: ", context);
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
							availButton: false
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

				context.askHelp = true;

				cb(context);
			});
		},

		selectRoom: function (context, cb) {
			RoomAmenities.getRooms(1098, {
				amenity: context.roomAmenity,
				type: context.roomType
			}, function (err, rooms) {
				console.log("select rooms: ", rooms[0]);

				rooms = rooms.map(function (room) {
					var roomTypes = ['single', 'double', 'triple', 'quadruple'];

					return {
						roomId: room.id,
						roomTypeName: room.roomTypeName,
						roomType: roomTypes[ room.maxOccupancy - 1 ],
						description: room.description,
						picture: room.image.source,
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

		selectDates: function (context, cb) {
			chat.addAnswer({
				type: "calendar",
			});

			cb(context);
		},

		hotelInfo: function (context, cb) {
			HotelInfo.getInfo(1098, context.hotelInfoName, function (err, value) {
				var response = { type: "msg" };

				if (context.hotelInfoName == "phone") {
					response.text = "Our phone number is " + value;
				} else if (context.hotelInfoName == "fax") {
					response.text = "Our fax is " + value;
				} else if (context.hotelInfoName == "checkIn") {
					response.text = "Check in time is " + value;
				} else if (context.hotelInfoName == "checkOut") {
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