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
	this.ai = new WitAPI('ALYKZ63ZUEGFYLSWQZGLFGNYVJ4TCY2O');

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

ChatBot.prototype.normalize = function () {

};

ChatBot.prototype.merge = function (text, entities, context, cb) {
	console.log("entities: ", entities);

	if (entities.intent) {
		context.intent = entities.intent[0].value;
		context[context.intent] = true;
	}

	if (entities.yes_no) {
		if (entities.yes_no[0].value == "yes") context[context.intent] = true;
		else if (entities.yes_no[0].value == "no") {
			context = {};
		}
	}

	if (entities.datetime) {
		if (entities.datetime[0].type == "interval") {
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
		context.nights = entities.nights[0].value;
	}

	if (entities.guests) {
		context.guests = entities.guests[0].value;

		var roomTypes = ['single', 'double', 'triple'];
		context.roomType = roomTypes[context.guests - 1];
	}

	if (entities.roomAmenity) {
		context.roomAmenity = entities.roomAmenity[0].value;
	}

	if (entities.roomType) {
		// console.log("room type: " + entities.roomType);

		context.roomType = entities.roomType[0].value;

		if (context.roomType == 'single') {
			context.guests = 1;
		} else if (context.roomType == 'double') {
			context.guests = 2;
		} else if (context.roomType == 'triple') {
			context.guests = 3;
		}
	}

	if (entities.location) {
		context.fromLocation = entities.location[0].value;
	}

	if (entities.hotelInfo) {
		context.hotelInfo = entities.hotelInfo[0].value;
	}

	
	if (entities.number) {
		// console.log("context nights", context);

		if (!context.dateOut) {
			context.dateOut = 
				moment(context.dateIn).add(entities.number[0].value, 'days').format('YYYY-MM-DD');
		}else if (!context.guests) {
			context.guests = entities.number[0].value;
		}
	}

	if (entities.message_subject) {
		context.message = text.replace(entities.message_subject[0].value, "").trim();
	}
	
	// console.log("result context: ", context);
	cb(context);
};

ChatBot.prototype.setupActions = function (message) {
	var self = this;

	this.ai.action('merge', self.merge);

	this.ai.action('say', (answer) => {
		self.addMessage(answer);
	});

	/*this.ai.addParser('book', this.parseDates);
	this.ai.addParser('book', this.parseGuests);

	this.ai.addParser('availability', this.parseDates);
	this.ai.addParser('availability', this.parseGuests);
*/
	this.ai.action('book', (context, cb) => {
		console.log("got to book");

		self.addAnswer({
			type: 'redirect',
			url: "https://www.paypal.com"
		});

		cb({});
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
				book: true,
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