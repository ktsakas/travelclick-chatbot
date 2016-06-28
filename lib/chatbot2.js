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
	this.ai = new WitAPI('LVQPYAXDQYWKFRSORXCCN3YR23S5AUQE');

	this.setupActions();

	return this;
}

util.inherits(ChatBot, EventEmitter);

ChatBot.prototype.parseDates = function (params) {
	var dateIn = params['dateIn'],
		nights = params['nights'],
		datePeriod = params['datePeriod'];

	if (datePeriod) {
		console.log('datePeriod: ', datePeriod);
		var datePeriod = params['datePeriod'].split('/');
		params['dateIn'] = datePeriod[0];
		params['nights'] = {
			number: moment(datePeriod[1], "YYYY-MM-DD").diff(params['dateIn'], 'days')
		};
		// console.log(moment(params['dateIn'], "YYYY-MM-DD").toString(),
			// moment(datePeriod[1], "YYYY-MM-DD").toString());
	} else if (dateIn && nights) {
		var dateOut = moment(dateIn, "YYYY-MM-DD").add(+nights.number, 'd').format("YYYY-MM-DD");
		params['datePeriod'] = dateIn + "/" + dateOut;
	}
	// console.log("parsedDates: ", params);

	return params;
};

ChatBot.prototype.parseGuests = function (params) {
	var roomTypes = ['single', 'double', 'triple'],
		guests = params['guests'],
		roomType = params['roomType'];

	if (guests) {
		params['roomType'] = roomTypes[guests.number - 1];
	} else if (roomType) {
		if (roomType.match(/single/i)) {
			params['guests'] = { number: 1 };
		} else if (roomType.match(/double/i)) {
			params['guests'] = { number: 2 };
		} else if (roomType.match(/triple/i)) {
			params['guests'] = { number: 3 };
		}
	}
	// console.log("parsedGuests: ", params);

	return params;
};

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

/*ChatBot.prototype.normalize = function () {

};*/

ChatBot.prototype.merge = function (entities, context, cb) {
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

	if (entities.dateIn) {
		context.dateIn = entities.dateIn[0].value.split('T')[0];

		if (entities.dateIn[0].grain == "month") {
			context.dateOut = 
				moment(context.dateIn).add(1, 'months').subtract(1, 'days').format('YYYY-MM-DD');
		}
	}

	if (entities.nights) {
		context.nights = entities.nights[0].value;
	}

	if (entities.guests) {
		context.guests = entities.guests[0].value;

		var roomTypes = ['single', 'double', 'triple'];
		context.guests = roomTypes[context.guests - 1];
	}

	if (entities.datetime) {
		context.dateIn = entities.datetime[0].from.value.split('T')[0];
		context.dateOut = entities.datetime[0].to.value.split('T')[0];
	}

	if (entities.roomAmenity) {
		context.roomAmenity = entities.roomAmenity[0].value;
	}

	if (entities.roomType) {
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

	if (context.dateIn && context.nights) {
		context.dateOut = moment(context.dateIn).add(context.nights, 'd').format('YYYY-MM-DD');
	}
	
	console.log("result context: ", context);
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
	this.ai.action('book', (params) => {
		console.log("got to book");

		self.addMessage('Thank you for booking with us! Redirecting to the payment page...');

		self.addAnswer({
			type: 'redirect',
			url: "https://www.paypal.com"
		});
	});

	this.ai.action('availability', (context, cb) => {
		console.log("params: ", context);

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
				intent: book,
				roomType: context.roomType,
				guests: context.guests
			};
			/*self.addAnswer({
				type: 'prompt',
				text: 'Would you like to book a room?',
				equiv: 'I would like to book a room.'
			});*/

			cb();
		});
	});

	this.ai.action('hotel-info', (params) => {
		HotelInfo.getInfo(1098, params.info, function (err, value) {
			var response = { type: "msg" };

			if (params.info == "phone") {
				response.text = "Our phone number is " + value;
			} else if (params.info == "fax") {
				response.text = "Our fax is " + value;
			} else if (params.info == "checkIn") {
				response.text = "Check in time is " + value;
			} else if (params.info == "checkOut") {
				response.text = "Check out time is " + value;
			}

			self.addAnswer(response);
		});
	});

	this.ai.action('call', (params) => {
		self.addAnswer({
			type: "msg",
			text: "Calling the hotel..."
		});
	});

	this.ai.action('text', (params) => {
		if (params['confirm'] == 'yes') {
			self.addMessage("Text sent successfully.");
		} else {
			self.addMessage("Ok, I will not text the hotel.");
		}

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