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
	  AIAPI = require('../apis/api_ai.js');


const RoomAmenities = require('./room-amenities.js'),
	  HotelInfo = require('./hotel-info.js'),
	  Availability = require('./availability.js');


function ChatBot () {
	this.answers = [];
	this.unsent = [];
	this.ai = new AIAPI();

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

ChatBot.prototype.addAnswer = function (message) {
	this.unsent.push(message);
};

ChatBot.prototype.popUnsent = function (message) {
	var results = this.unsent.slice(); // Copy
	this.answers = this.answers.concat(this.unsent);
	this.unsent = [];

	return results;
};

ChatBot.prototype.setupActions = function (message) {
	var self = this;

	this.ai.on('say', (answer) => {
		self.addAnswer({
			type: "msg",
			text: answer
		});

		self.emit("respond", self.popUnsent());
	});

	/*this.ai.addParser('book', this.parseDates);
	this.ai.addParser('book', this.parseGuests);

	this.ai.addParser('availability', this.parseDates);
	this.ai.addParser('availability', this.parseGuests);
*/
	this.ai.on('book', (params) => {
		console.log("got to book");

		self.addAnswer({
			type: 'msg',
			text: 'Thank you for booking with us! Redirecting to the payment page...'
		});

		self.addAnswer({
			type: 'redirect',
			url: "https://www.paypal.com"
		})

		self.emit("respond", self.popUnsent());
	});

	this.ai.on('availability', (params) => {
		console.log("params: ", params);

		params = Availability.parseOptions(params);

		console.log("parsed params: ", params);

		Availability.get(params, function (err, available) {
			// console.log("available: ", available);

			self.addAnswer({
				type: 'msg',
				text: 'Here is our availabilty: '
			});

			self.addAnswer({
				type: 'availability',
				dates: available
			});

			self.addAnswer({
				type: 'prompt',
				text: 'Would you like to book a ' + params.roomType + '?',
				equiv: 'I would like to book a single.'
			});

			self.emit("respond", self.popUnsent());
		});
	});

	this.ai.on('location', (params) => {
		HotelInfo.getInfo(1098, 'position', function (err, pos) {
			self.addAnswer({
				type: "msg",
				text: "Our address is 1 Jenkin Street"
			});

			self.addAnswer({
				type: "location",
				location: {
					lat: parseFloat(pos.latitude),
					lng: parseFloat(pos.longitude)
				}
			});

			self.emit("respond", self.popUnsent());
		});
	});

	this.ai.on('directions', (params) => {
		console.log("got to directions");

		self.addAnswer({
			type: 'directions',
			origin: "JFK Airport",
			dest: {
                lat: 37.8386741,
                lng: -122.2936934
            }
		});

		self.emit("respond", self.popUnsent());
	});

	this.ai.on('rooms-info', (params) => {
		RoomAmenities.getRooms(1098, params.roomAmenities, function (err, rooms) {
			console.log(params);

			if (rooms.length == 0) {
				self.addAnswer({
					type: "msg",
					text: "Unfortunately, we don't have any rooms with " + params.roomAmenities + "."
				})
			} else {
				self.addAnswer({
					type: "msg",
					text: "Only, some of our rooms have " + params.roomAmenities + ": "
				});

				self.addAnswer({
					type: "rooms",
					rooms: rooms
				});
			}

			self.addAnswer({
				type: 'prompt',
				text: 'Would you like to book a room?',
				equiv: 'I would like to book a room.'
			});

			self.emit("respond", self.popUnsent());
		});
	});

	this.ai.on('hotel-info', (params) => {
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
			self.emit("respond", self.popUnsent());
		});
	});

	this.ai.on('call', (params) => {
		self.addAnswer({
			type: "msg",
			text: "Calling the hotel..."
		});

		self.emit("respond", self.popUnsent());
	});

	this.ai.on('text', (params) => {
		if (params['confirm'] == 'yes') {
			self.addAnswer({
				type: "msg",
				text: "Text sent successfully."
			});
		} else {
			self.addAnswer({
				type: "msg",
				text: "Ok, I will not text the hotel."
			});
		}

		self.emit("respond", self.popUnsent());
	});
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