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
	  // ChatBot = require('./app/chatbot.js'),
	  WitChat = require('./app/chatbot2.js'),
	  port = process.env.PORT || 3000;
// var chatbot = new ChatBot();
// var witchat = new WitChat();
var chats = {};

// Show all debug messages
l.level = 'silly';

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
app.use(express.static('./public'))
   .use(bodyParser.json())
   .use(bodyParser.urlencoded({ extended: false }));



app.get('/chat/:sessionId', function (req, res) {
	var chat = chats[req.params.sessionId];
	if (!chat) chat = chats[req.params.sessionId] = new WitChat();

	var knownEntities = req.query.knownEntities ? JSON.parse(req.query.knownEntities) : {};
	

	console.log("from session: ", req.params.sessionId, req.query.message, knownEntities);
	chats[req.params.sessionId].respond(req.query.message, knownEntities, function (response) {
		res.json(response);
	});
});

/*
	Route that responds to messages
*/
/*app.get('/message', function (req, res) {
	chatbot.respond(req.query.message, function (response) {
		console.log("responding");
		res.json(response);//.bind(res)
	});
});*/


/*
	Reviews lists routes in JSON format
*/
app.get('/reviews', function (req, res) {
	var checkOnly = 10;

	var reviews = require('./mock-reviews.js');
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
app.get('/reset/:sessionId', function (req, res) {
	chats[req.params.sessionId] = new WitChat();
});

/*
	Start the app
*/
app.use('/', require('./mock_api.js'))
   .listen(port, () => l.info("Chatbot listening on 127.0.0.1:" + port));