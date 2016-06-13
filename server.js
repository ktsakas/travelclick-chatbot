const l = require('winston');
l.level = 'silly';

const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const port = process.env.PORT || 8080;

// Wit.ai stuff
const token = process.argv[2] || "5IXU33BVOCVY5H4H4CUW5LCQP6WXL636";
const WitAPI = new require('./wit-api.js')(token);
const request = require('request');
const _ = require('underscore');
const WatsonAPI = require('./watson-api.js');
var BingAPI = require('node-bing-api')({
	accKey: "1936e4b6536b4de49addb18f2d4ae22b",
	rootUri: "https://api.datamarket.azure.com/Bing/SearchWeb/v1/"
});

new WatsonAPI().analyze("Hi, how are you?", function (language, sentiment) {
	console.log(sentiment, language);
});

BingAPI.spelling('Does the room have a telepone?', function (err, res, body) {
	console.log(body); //awesome spell 
});

const firstEntityValue = (entities, entity) => {
  l.debug(entity, JSON.stringify(entities[entity]));
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value
  ;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

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

function parseQuery() {

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

const Story = new WitAPI.Story({
	say(context, message) {
		l.debug("saying!", message, "\n");
		this.addAnswer({
			type: "msg",
			data: message
		});
	},

	merge(context, entities, message) {
		l.debug(message, entities);

		// Retrieve the location entity and store it into a context field
		const intent = firstEntityValue(entities, 'intent');
		if (intent) this.set('intent', intent);

		const price = firstEntityValue(entities, 'price');
		if (price) this.set('price', price);

		const datetime = entities.datetime ? entities.datetime[0].values : null;
		if (datetime) this.set('datetime', datetime);

		const stayDuration = firstEntityValue(entities, 'stayDuration');
		if (stayDuration) this.set('stayDuration', stayDuration);

		const guests = firstEntityValue(entities, 'guests');
		if (guests) this.set('guests', guests);

		const yes_no = firstEntityValue(entities, 'yes_no');
		if (yes_no) this.set('yes_no', yes_no);

		const amenity = firstEntityValue(entities, 'amenity');
		console.log("amenity: ", amenity);
		if (amenity) this.set('amenity', amenity);

		this.set('roomType', 'single');
		this.set('price', '60$');

		/*this.addAnswer({
			type: "msg",
			data: JSON.stringify(context)
		});*/

		l.debug("Updated context: ", this.context);
	},

	error(context, error) {
		l.error(error);
	},

	inquire(context) {
		console.log("amenity ", context);

		queryRooms(context.amenity, function (results) {
			this.addAnswer({
				type: "msg",
				data: JSON.stringify(results)
			});
		}.bind(this));
	},

	hotel: {
		getRooms(context) {
			var query = parseCtxToQuery(context);
		},

		getLangs(context) {

		},

		getPayments(context) {

		},

		getPackages(context) {

		},

		getCurrencies(context) {

		}
	},

	reservation: {
		setDates(context) {
			this.addAnswer({ type: "setDates" });

			this.wait();
		},

		setRoomType(context) {
			this.addAnswer({
				type: "setRoomType",
				rooms: [
					{ hotelCode: 1098, roomCode: 1289, roomName: "Suite", picture: "http://placehold.it/100x100"},
					{ hotelCode: 1099, roomCode: 3242, roomName: "King room view", picture: "http://placehold.it/100x100"},
					{ hotelCode: 6938, roomCode: 8991, roomName: "High garden", picture: "http://placehold.it/100x100"}
				],
				packages: []
			});

			this.wait();
		},

		confirm(context) {

			this.wait();
		}
	}
});

function requestHandler (req, res) {
	l.debug(req.query.message);

	Story.continue(req.query.message);

	Story.once("stopped", function (answers, context) {
		// l.debug("answers: ", answers);
		// l.debug("context: ", context);
		res.json({ "answers": answers });
	});
}

app.get('/message', requestHandler);

app.get('/setRoomType', function (req, res) {
	Story.set('roomType', req.query.code);

	requestHandler(req, res);
});

app.get('/setDates', function (req, res) {
	Story.set('dates', req.query.startDate);

	requestHandler(req, res);
});

app.get('/reset', function (req, res) {
	Story.reset();
});

app.listen(port, function () {
	l.info("Chatbot listening on 127.0.0.1:" + port);
});