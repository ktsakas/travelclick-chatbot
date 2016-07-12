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
	  util = require('util'),
	  moment = require('moment'),
	  Actions = require('./actions');

// Show all debug messages
l.level = 'silly';

// Import our API wrappers and libraries
const WatsonAPI = require('../apis/vendor/watson'),
	  BingAPI = require('../apis/vendor/bing'),
	  TwilioAPI = require('../apis/vendor/twilio'),
	  WitAPI = require('../apis/vendor/wit2');

const parsers = require('./parsers')


function ChatBot () {
	this.answers = [];
	this.unsent = [];
	this.actions = new Actions(this);
	this.ai = new WitAPI('S2AXZPXVMNSSMSBCGS3IFRO2FN2DFHC6');

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
};

ChatBot.prototype.normalize = function (entities) {
	var firstValEntities = [
		'intent', 'textCommand', 'yes_no', 'nights', 'guests', 'roomType', 'location', 'hotelInfo', 'number', 'roomAmenity'
	];

	/*
	* Pick out the first value for each of the entities
	*/
	for (var name in entities) {
		if ( _.contains(firstValEntities, name) ) {
			// console.log("entities[" + name + "]: " + entities[name]);
			entities[name] = entities[name][0].value;
		}
	}

	return entities;
};


ChatBot.prototype.parseDates = function (entities) {
	if (!entities.datetime) return entities;

	console.log("datetime: ", entities.datetime)

	if (entities.datetime[0].type == "interval") {
		entities.dates = [
			entities.datetime[0].from.value.split('T')[0],
			entities.datetime[0].to.value.split('T')[0]
		];
	} else {
		entities.dates = [ entities.datetime[0].value.split('T')[0] ];

		if (entities.datetime[0].grain == "month") {
			entities.dates[1] = 
				moment(entities.dates[0]).add(1, 'months').subtract(1, 'days').format('YYYY-MM-DD');
		}
	}

	delete entities.datetime;

	return entities;
};

ChatBot.prototype.popUnsent = function (message) {
	var results = this.unsent.slice(); // Copy
	this.answers = this.answers.concat(this.unsent);
	this.unsent = [];

	return results;
};

ChatBot.prototype.setupActions = function () {
	var self = this;

	Object.keys(this.actions).forEach(function (action) {
		if (action == 'say') {
			self.ai.action('say', self.actions.say);

		} else if (action == 'merge') {
			self.ai.action(action, function (text, context, entities, cb) {
				console.log("merge: ", text, context, entities, cb);

				if (entities) {
					// Normalize the entities first
					entities = self.normalize(entities);

					// Parse the dates
					entities = self.parseDates(entities);
				}

				console.log("known: ", self.knownEntities);

				// Merge the normalized entities with the knownEntities ones
				entities = _.extend(entities || {}, self.knownEntities || {});


				self.actions.merge(text, context, entities, cb);
			});

		} else {
			self.ai.action(action, self.actions[action]);
		}
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

ChatBot.prototype.respond = function (message, knownEntities, cb) {
	var self = this;

	this.analyze(message, function (err, analysis) {
		var response = { analysis: analysis };

		/*if (analysis.lang != 'english') {
			WatsonAPI.translateEn(
				"My " + analysis.lang + " is not that good, could you repeat that in English?",
				analysis.langAcronym,
				function (err, translation) {
					console.log("translation");
					self.addMessage({
						type: "msg",
						text: translation
					});

					response.answers = self.popUnsent();
					cb(response);
				}.bind(self)
			);
		} else {*/
			self.text = message;
			self.knownEntities = knownEntities;

			self.once("respond", function (answers) {
				response.answers = answers;
				cb(response);
			});

			console.log("known early: ", self.knownEntities);

			self.ai.query(message);
		// }
	});
};

module.exports = ChatBot;