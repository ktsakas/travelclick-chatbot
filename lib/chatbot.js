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

// Show all debug messages
l.level = 'silly';

// Import our API wrappers and libraries
const WatsonAPI = require('../apis/watson.js'),
	  BingAPI = require('../apis/bing.js'),
	  TwilioAPI = require('../apis/twilio.js'),
	  AIAPI = require('../apis/api_ai.js');
var   AIapi = new AIAPI();


const RoomAmenities = require('./room-amenities.js'),
	  HotelInfo = require('./hotel-info.js'),
	  Availability = require('./availability.js');


function ChatBot () {
	this.answers = [];
	this.unsent = [];

	this.setupActions();

	return this;
}

util.inherits(ChatBot, EventEmitter);

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

	AIapi.on('say', (answer) => {
		console.log('called say');

		self.addAnswer({
			type: "msg",
			text: answer
		});

		console.log("in setup: ", self);
		self.emit("respond", self.popUnsent());
	});

	AIapi.on('availability', (params) => {
		Availability.get(params, function (err, available) {
			self.addAnswer({
				type: 'availability',
				dates: available
			});

			self.emit("respond", self.popUnsent());
		});
	});

	AIapi.on('location', (params) => {
		console.log('location');
		self.addAnswer({
			type: "msg",
			text: "Our address is Whatever"
		});

		self.addAnswer({
			type: "location",
			location: {
                lat: 37.8386741,
                lng: -122.2936934
            }
		});

		self.emit("respond", self.popUnsent());
	});

	AIapi.on('directions', (params) => {
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

	AIapi.on('rooms-info', (params) => {
		console.log(RoomAmenities);

		RoomAmenities.getRooms(1098, 'tv', function (err, rooms) {
			console.log(rooms);

			self.addAnswer({
				type: "msg",
				text: JSON.stringify(rooms)
			});

			self.emit("respond", self.popUnsent());
		});
	});

	AIapi.on('hotel-info', (params) => {
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

			AIapi.query(message);
		}
	}.bind(this));
};

module.exports = ChatBot;