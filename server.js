const l = require('winston');
l.level = 'silly';

const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const port = process.env.PORT || 8080;

// Wit.ai stuff
const token = process.argv[2] || "W3IT6SFAE2TRBE7GVDEJEDFYNPS6QY6P";
const WitAPI = new require('./wit-api.js')(token);


const firstEntityValue = (entities, entity) => {
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
		console.log(entities);

		// Retrieve the location entity and store it into a context field
		const intent = firstEntityValue(entities, 'intent');
		if (intent) this.set('intent', intent);
		
		const loc = firstEntityValue(entities, 'location');
		if (loc) this.set('loc', loc);

		const price = firstEntityValue(entities, 'price');
		if (price) this.set('price', price);

		const property = firstEntityValue(entities, 'property');
		if (property) this.set('property', property);

		this.addAnswer({
			type: "msg",
			data: JSON.stringify(context)
		});

		l.debug("Updated context: ", this.context);
	},

	error(context, error) {
		l.error(error);
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
	// l.debug(req.query);

	Story.continue(req.query.message);

	Story.once("stopped", function (answers, context) {
		// l.debug("answers: ", answers);
		l.debug("context: ", context);
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

app.listen(port, function () {
	l.info("Chatbot listening on 127.0.0.1:" + port);
});