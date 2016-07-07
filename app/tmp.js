	var self = this;

	this.ai.action('merge', self.merge.bind(self));

	this.ai.action('say', (answer) => {
		self.addMessage(answer);
	});

	/*this.ai.addParser('book', this.parseDates);
	this.ai.addParser('book', this.parseGuests);

	this.ai.addParser('availability', this.parseDates);
	this.ai.addParser('availability', this.parseGuests);
*/
	this.ai.action('book', (context, entities, cb) => {
		// context = this.parseMerge();
		context = this.parseBook(context, entities, cb);

		else if (!context.dateOut) context.askNights = true;
		else if (!context.guests) context.askGuests = true;
		else {
			self.addAnswer({
				type: 'redirect',
				url: "https://www.paypal.com"
			});

			context.bookSuccess = true;
		}

		cb(context);
	});

	this.ai.action('availability', (context, entities, cb) => {
		console.log("avail: ", entities);
		context = this.parseAvailability(context, entities, cb);
		
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

				self.addMessage('Here is our availabilty: ');

				self.addAnswer({
					type: 'availability',
					dates: available
				});

				/*self.addAnswer({
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
	});

	this.ai.action('location', (context, entities, cb) => {
		HotelInfo.getInfo(1098, 'position', function (err, pos) {
			self.addMessage("Our address is 1 Jenkin Street");

			self.addAnswer({
				type: "location",
				location: {
					lat: parseFloat(pos.latitude),
					lng: parseFloat(pos.longitude)
				}
			});

			cb({});
		});
	});

	this.ai.action('directions', (context, entities, cb) => {
		context = this.parseDirections(context, entities, cb);

		if (!context.fromLocation) {
			context.askFromLocation = true;

			cb(context);
		} else {
			context.success = true;

			self.addAnswer({
				type: 'directions',
				origin: "JFK Airport",
				dest: {
					lat: 37.8386741,
					lng: -122.2936934
				}
			});

			cb(context);
		}

		
	});

	this.ai.action('showRooms', (context, entities, cb) => {
		context = this.parseRoomInfo(context, entities, cb);

		RoomAmenities.getRooms(1098, {
			amenity: context.roomAmenity,
			type: context.roomType
		}, function (err, rooms) {
			console.log(context);

			if (rooms.length >= 0) {
				if (context.roomAmenity && context.roomType) {
					self.addMessage(
						"Here are all our " + context.roomType + " with " + context.roomAmenity
					);
				} else if (context.roomType) {
					self.addMessage(
						"Here are all our " + context.roomType
					);
				} else if (context.roomAmenity) {
					self.addMessage(
						"Here are all our rooms with " + context.roomAmenity + "."
					);
				}

				rooms = rooms.map(function (room) {
					room.roomId = room.id;
					return room;
				});

				self.addAnswer({
					type: "rooms",
					rooms: rooms,
					bookButton: true,
					availButton: true
				});
			} else {
				var roomType = context.roomType || "room";
				var amenitySuffix = context.roomAmenity ? " with " + context.roomAmenity : "";

				self.addMessage(
					"Unfortunately, we don't have any " + roomType + amenitySuffix + "."
				);
			}

			cb(context);
		});
	});

	this.ai.action('hotelInfo', (context, entities, cb) => {
		entities = this.normalize(entities);
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

			self.addAnswer(response);

			cb({});
		});
	});

	this.ai.action('call', (context, entities, cb) => {
		self.addAnswer({
			type: "msg",
			text: "Calling the hotel..."
		});

		cb({});
	});

	this.ai.action('text', (context, entities, cb) => {
		/*if (context == 'yes') {
			self.addMessage("Text sent successfully.");
		} else {
			self.addMessage("Ok, I will not text the hotel.");
		}*/

		cb({});
	});

	this.ai.action('invalid', (context, entities, cb) => {
		self.addAnswer({
			type: "msg",
			text: "I am not sure what you mean by that."
		});

		cb({});
	});

	this.ai.action('stop', function () {
		console.log("STOPPED ACTION CALLED!");
		self.emit('respond', self.popUnsent());
	})