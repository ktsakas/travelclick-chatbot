/*
	This is the core of the chatbot
	it is responsible for using all libraries and apis
	to answer chat messages
*/

// Import NPM libraries
const l = require('winston'),
	  _ = require('underscore'),
	  async = require('async'),
	  EventEmitter = require('events').EventEmitter,
	  util = require('util');
const moment = require('moment');

// Show all debug messages
l.level = 'silly';

console.log("whatever");

// Import our API wrappers and libraries
const WatsonAPI = require('../apis/watson.js'),
	  BingAPI = require('../apis/bing.js'),
	  TwilioAPI = require('../apis/twilio.js'),
	  WitAPI = require('../apis/wit2.js');


const RoomAmenities = require('./room-amenities.js'),
	  HotelInfo = require('./hotel-info.js'),
	  Availability = require('./availability.js');


function ChatBot () {
	this.answers = [];
	this.unsent = [];
	this.ai = new WitAPI('3FUM2QBTAXDPAHVFMB2GGVZC6F6MKFHB');

	console.log("new ctx: ", this.ai.context);

	this.setupActions();

	return this;
}

util.inherits(ChatBot, EventEmitter);

ChatBot.prototype.addAnswer = function (answer) {
	this.unsent.push(answer);
};

ChatBot.prototype.addMessage = function (message) {
	this.unsent.push({
		type: "msg",
		text: message
	});
}

ChatBot.prototype.popUnsent = function (message) {
	var results = this.unsent.slice(); // Copy
	this.answers = this.answers.concat(this.unsent);
	this.unsent = [];

	return results;
};

ChatBot.prototype.normalize = function (entities) {
	console.log("normalizing: ", entities);
	var firstValEntities = [
		'intent', 'yes_no', 'nights', 'guests', 'roomType', 'location', 'hotelInfo', 'number'
	];

	/*
	* Pick out the first value for each of the entities
	*/
	for (var name in entities) {
		if ( _.contains(firstValEntities, name) ) {
			entities[name] = entities[name][0].value;
		}
	}
	
	console.log("normalized", entities);

	return entities;
};

ChatBot.prototype.getDates = function (entities) {
	if (!entities.datetime) return [];

	if (entities.datetime[0].value == "interval") {
		return [
			entities.datetime[0].from.value.split('T')[0],
			entities.datetime[0].to.value.split('T')[0]
		];
	} else {
		dates = [ entities.datetime[0].value.split('T')[0] ];

		if (entities.datetime[0].grain == "month") {
			dates[1] = 
				moment(context.dateIn).add(1, 'months').subtract(1, 'days').format('YYYY-MM-DD');
		}

		return dates;
	}
}

ChatBot.prototype.parseBook = function (text, entities, context, cb) {
	var dates = this.getDates(entities);

	delete context.missingDateIn;
	delete context.missingDateOut;
	delete context.missingGuests;

	entities.nights = entities.number;
	entities.guests = entities.number;
	console.log("parsing book context: ", context);

	if (entities.intent == "book") {
		console.log("parsed index: ", context, '\n\n');

		if (!context.dateIn && dates.length >= 1) context.dateIn = dates[0];
		if (!context.dateOut && dates.length >= 2) context.dateOut = dates[1];
		if (!context.guests && entities.guests) context.guests = entities.guests;
	} else {
		console.log("setting date in\n\n");
		if (!context.dateIn) {
			if (dates.length == 0) this.addMessage("I expected a date. Could you repeat that?");

			context.dateIn = dates[0];
			if (dates[1]) context.dateOut = dates[1];
		} else if (!context.dateOut) {
			if (dates.length > 0) {
				context.dateOut = dates[0];
			} else if (entities.nights) {
				context.dateOut = moment(context.dateIn).add(1, 'months').subtract(1, 'days').format('YYYY-MM-DD');
			} else {
				this.addMessage("I didn't get that. How many nights are you staying?");
			}
		} else if (!context.guests) {
			if (!entities.guests) {
				this.addMessage("I expected the number of guests. Could you repeat that?")
			} else {
				context.guests = entities.guests;
			}
		}
	}

	return context;
};

ChatBot.prototype.merge = function (text, entities, context, cb) {
	entities = this.normalize(entities);
	entities.dates = this.getDates(entities);

	if (entities.intent) {
		if (!entities.yes_no) {
			context[entities.intent] = true;
		} else if (entities.yes_no == "yes") {
			context[context.intent] = true;
		} else if (entities.yes_no == "no") {
			context = {};
		}
	}

	if (context.book) {
		context = this.parseBook(text, entities, context, cb);

	} else {

		/*if (entities.intent) {
			context.intent = entities.intent;
			context[context.intent] = true;
		}

		if (entities.yes_no) {
			if (entities.yes_no == "yes") context[context.intent] = true;
			else if (entities.yes_no == "no") {
				context = {};
			}
		}

		if (entities.datetime) {
			if (entities.datetime == "interval") {
				var dateIn = entities.datetime[0].from.value.split('T')[0];
				var dateOut = entities.datetime[0].to.value.split('T')[0];

				if (!context.dateIn) context.dateIn = dateIn;
				if (!context.dateOut) context.dateOut = dateOut;

				console.log(context);
			} else {
				var dateIn = entities.datetime[0].value.split('T')[0],
					dateOut;

				if (!entities.dateIn && dateIn) context.dateIn = dateIn;

				// console.log("got in hrere!!!!!!", entities.datetime);
				if (entities.datetime[0].grain == 'month') {
					context.dateOut =
						moment(context.dateIn).add(1, 'months').subtract(1, 'days').format('YYYY-MM-DD');
				}
			}
		}

		if (entities.nights) {
			context.nights = entities.nights;
		}

		if (entities.guests) {
			context.guests = entities.guests;

			var roomTypes = ['single', 'double', 'triple'];
			context.roomType = roomTypes[context.guests - 1];
		}

		if (entities.roomAmenity) {
			context.roomAmenity = entities.roomAmenity;
		}

		if (entities.roomType) {
			// console.log("room type: " + entities.roomType);

			context.roomType = entities.roomType;

			if (context.roomType == 'single') {
				context.guests = 1;
			} else if (context.roomType == 'double') {
				context.guests = 2;
			} else if (context.roomType == 'triple') {
				context.guests = 3;
			}
		}

		if (entities.location) {
			context.fromLocation = entities.location;
		}

		if (entities.hotelInfo) {
			context.hotelInfo = entities.hotelInfo;
		}

		
		if (entities.number) {
			// console.log("context nights", context);

			if (!context.dateOut) {
				context.dateOut = 
					moment(context.dateIn).add(entities.number, 'days').format('YYYY-MM-DD');
			}else if (!context.guests) {
				context.guests = entities.number;
			}
		}

		if (entities.message_subject) {
			context.message = text.replace(entities.message_subject, "").trim();
		}*/
		
	}

	cb(context);
};

ChatBot.prototype.setupActions = function (message) {
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
	this.ai.action('book', (context, cb) => {
		if (!context.dateIn) context.missingDateIn = true;
		else if (!context.dateOut) context.missingDateOut = true;
		else if (!context.guests) context.missingGuests = true;
		else {
			self.addAnswer({
				type: 'redirect',
				url: "https://www.paypal.com"
			});

			cb({ success: true });
			return;
		}

		cb(context);
	});

	this.ai.action('availability', (context, cb) => {
		// console.log("availability: ", Availability.parseOptions(context));

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
				intent: 'book',
				roomType: context.roomType,
				guests: context.guests
			};

			cb(context);
		});
	});

	this.ai.action('location', (params, cb) => {
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

	this.ai.action('directions', (params, cb) => {
		console.log("got to directions");

		self.addAnswer({
			type: 'directions',
			origin: "JFK Airport",
			dest: {
                lat: 37.8386741,
                lng: -122.2936934
            }
		});

		cb({});
	});

	this.ai.action('roomInfo', (params, cb) => {
		console.log(params);
		RoomAmenities.getRooms(1098, params.roomAmenity, function (err, rooms) {
			console.log(params);

			if (rooms.length == 0) {
				self.addMessage(
					"Unfortunately, we don't have any rooms with " + params.roomAmenity + "."
				);
			} else {
				self.addMessage("Only, some of our rooms have " + params.roomAmenity + ": ");

				self.addAnswer({
					type: "rooms",
					rooms: rooms
				});
			}

			context = {
				intent: "book",
				book: true
			};
			/*self.addAnswer({
				type: 'prompt',
				text: 'Would you like to book a room?',
				equiv: 'I would like to book a room.'
			});*/

			cb(context);
		});
	});

	this.ai.action('hotelInfo', (context, cb) => {
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

			self.addAnswer(response);

			cb({});
		});
	});

	this.ai.action('call', (context, cb) => {
		self.addAnswer({
			type: "msg",
			text: "Calling the hotel..."
		});

		cb({});
	});

	this.ai.action('text', (context, cb) => {
		self.addMessage("Text sent successfully: " + context.message);

		/*if (context == 'yes') {
			self.addMessage("Text sent successfully.");
		} else {
			self.addMessage("Ok, I will not text the hotel.");
		}*/

		cb({});
	});

	this.ai.action('stop', function () {
		console.log("STOPPED ACTION CALLED!");
		self.emit('respond', self.popUnsent());
	})
};

ChatBot.prototype.analyze = function (message, cb) {
	async.parallel([
		WatsonAPI.sentiment.bind(WatsonAPI, message),
		WatsonAPI.identifyLang.bind(WatsonAPI, message),
		BingAPI.spellcheck.bind(BingAPI, message),
		WatsonAPI.emotions.bind(WatsonAPI, message)
	], function (err, args) {
		var analysis = {
			lang: args[0][0],
			sentiment: args[0][1],
			langAcronym: args[1],
			spellingErrs: args[2],
			emotions: args[3]
		};

		cb(err, analysis);
	});
};

ChatBot.prototype.respond = function (message, cb) {
	this.analyze(message, function (err, analysis) {
		var response = { analysis: analysis };

		if (analysis.lang != 'english') {
			WatsonAPI.translateEn(
				"My " + analysis.lang + " is not that good, could you repeat that in English?",
				analysis.langAcronym,
				function (err, translation) {
					console.log("translation");
					this.addMessage({
						type: "msg",
						text: translation
					});

					response.answers = this.popUnsent();
					cb(response);
				}.bind(this)
			);
		} else {
			this.once("respond", function (answers) {
				response.answers = answers;
				cb(response);
			});

			this.ai.query(message);
		}
	}.bind(this));
};

module.exports = ChatBot;