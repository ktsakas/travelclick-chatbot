/*
	Import NPM libraries
*/
const l = require('winston'),
	  request = require('request'),
	  _ = require('underscore'),
	  express = require('express'),
	  async = require('async'),
	  bodyParser = require('body-parser'),
	  app = express(),
	  ChatBot = require('./lib/chatbot.js'),
	  port = process.env.PORT || 8080;
var chatbot = new ChatBot();

// Show all debug messages
l.level = 'silly';

/*
	Import our API wrappers and libraries
*/
const WatsonAPI = require('./apis/watson.js'),
	  BingAPI = require('./apis/bing.js'),
	  TwilioAPI = require('./apis/twilio.js'),
	  AIAPI = require('./apis/api_ai.js');
	  AIapi = new AIAPI();

const Chat = require('./sequential-chat.js'),
	  chat = new Chat(),
	  RoomAmenities = require('./lib/room-amenities.js'),
	  HotelInfo = require('./lib/hotel-info.js'),
	  Availability = require('./lib/availability.js');

function parseCtxToQuery(context) {
	var rooms = [];
	var filters = [{
		property: "price",
		min: 10,
		max: 100
	}];
	var sort = "price";
	var asc = true;
	var limit = null;

	switch (context.roomQuality) {
		case "best":
			sort = "price";
			asc = false;
			limit = 1;
			break;

		case "cheapest":
			sort = "price";
			asc = true;
			limit = 1;
			break;

		default:
			break;
	}

	filters.append({
		property: "dates",
		min: "startDate",
		max: "endDate"
	});
}

function queryRooms(searchAmenity, cb) {
	request.get("http://ibeapil01-t4.ilcb.tcprod.local:8080/ibe/v1/hotel/1098/info?options=rooms",
		function(err, res, body) {
			// console.log(JSON.parse(body).facilityInfo.guestRooms);
			var rooms = JSON.parse(body).facilityInfo.guestRooms;

			var results =
			_.filter(rooms, function (room) {
				console.log(room.id);

				var has = !!_.find(room.amenities, function (amenity) {
					console.log( amenity.amenityName.trim().toLowerCase() );
					return amenity.amenityName.trim().toLowerCase() == searchAmenity.trim().toLowerCase();
				});
				return has;
			});

			l.debug(results);
			cb(results);
		});
}

/*queryRooms('tv', function (results) {
	l.debug(results);
});*/


// Express.js
app.use(express.static('.'))
   .use(bodyParser.json())
   .use(bodyParser.urlencoded({ extended: false }));


function setupActions (res, cb) {
	AIapi.once('say', (answer) => {
		console.log(answer);

		chat.addResponse({
			type: "msg",
			text: answer
		});

		cb(analysis, chat.popUnsent());
	});

	AIapi.once('availability', (params) => {
		console.log("running availability");

		var datePeriod = params['date-period'].split('/');

		Availability.get({
			dateIn: datePeriod[0],
			dateOut: datePeriod[1],
			guests: params.guests.roomType
		}, function (err, available) {
			console.log(available);

			chat.addResponse({
				type: 'availability',
				dates: available
			});

			cb(analysis, available);
		});
	});

	AIapi.once('location', (params) => {
		chat.addResponse({
			type: "location",
			location: {
                lat: 37.8386741,
                lng: -122.2936934
            }
		});

		cb(analysis, chat.popUnsent());
	});

	AIapi.once('directions', (params) => {
		console.log("got to directions");

		chat.addResponse({
			type: 'directions',
			origin: "JFK Airport",
			dest: {
                lat: 37.8386741,
                lng: -122.2936934
            }
		});

		cb(analysis, chat.popUnsent());
	});

	AIapi.once('rooms-info', (params) => {
		console.log(RoomAmenities);

		RoomAmenities.getRooms(1098, 'tv', function (err, rooms) {
			console.log(rooms);

			chat.addResponse({
				type: "msg",
				text: JSON.stringify(rooms)
			});

			cb(analysis, chat.popUnsent());
		});
	});

	AIapi.once('hotel-info', (params) => {
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

			chat.addResponse(response);
			cb(analysis, chat.popUnsent());
		});
	});
}

function analyze (message, cb) {
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

	return;

	WatsonAPI.sentiment(message, function (err, lang, sentiment) {
		analysis.lang = lang;

		/*
			If the message is not in English ask the user in his native language
			to repeat the message in English
		*/
		if (lang != 'english') {
			WatsonAPI.identifyLang(message, function (err, langAcronym) {
				WatsonAPI.translateEn(
					"My " + lang + " is not that good, could you repeat that in English?",
					langAcronym,
					(err, translation) => chat.addResponse({
						type: "msg",
						text: translation
					})
				);
			});

			return;
		}
		
		/*
			Check the message for spelling errors
		*/
		BingAPI.spellcheck(message, function (err, spellingErrs) {
			analysis.spellingErrors = spellingErrs;

			if (spellingErrs.length > 0) {
				chat.addResponse({
					type: "msg",
					text: "Did you mean?"
				});

				cb(analysis, chat.popUnsent());
				return;
			}

			/*
				Analyze the emotions in the message
			*/
			WatsonAPI.emotions(message, function (err, emotions) {
				analysis.sentiment = sentiment;
				analysis.emotions = emotions;

				setupActions();

				return;
			});
		});
	});
}

function respond (message, cb) {
	analyze(message, function (err, analysis) {
		var response = { analysis: analysis };

		if (analysis.lang != 'english') {
			WatsonAPI.translateEn(
				"My " + lang + " is not that good, could you repeat that in English?",
				analysis.langAcronym,
				function (err, translation) {
					chat.addResponse({
						type: "msg",
						text: translation
					});

					response.answers = chat.popUnsent();
					cb(response);
				}
			);
		} else {
			getAnswer(message, function () {
				response.answers = chat.popUnsent();
				cb(response);
			});
		}
	});
}

/*
	Route that responds to messages
*/
app.get('/message', function (req, res) {
	console.log("in message: ", chatbot);

	chatbot.respond(req.query.message, function (response) {
		console.log("responding");
		res.json(response);/*.bind(res)*/
	});
});


/*
	Reviews lists routes in JSON format
*/
app.get('/reviews', function (req, res) {
	var checkOnly = 10;

	var reviews = require('./bad-mock-reviews.js');
	var done = _.after(checkOnly, function () {
		res.json(reviews.sortBy(function (review) {
			review.sentiment.score = parseFloat(review.sentiment.score);

			return review.sentiment.score;
		}));
	});

	reviews = _.chain(reviews)
		.sortBy(function (review) {
			return review.text.length;
		})
		.first(checkOnly)
		.each(function (review) {
			review.size = review.text.length;

			WatsonAPI.sentiment(review.text, function (lang, sentiment)  {
				console.log(sentiment);
				review.sentiment = sentiment;

				done();
			});

			// return review;
		});

	console.log(reviews.size());
});

/*
	Reset the chat (it's called whenever the page is reloaded)
*/
app.get('/reset', function (req, res) {
	console.log("resetting");
	chatbot = new ChatBot();
});

/*
	Start the app
*/
app.listen(port, () => l.info("Chatbot listening on 127.0.0.1:" + port));