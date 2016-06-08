const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const port = process.env.PORT || 8080;

// Wit.ai stuff
const token = process.argv[2] || "WIF63EXCCRVJ2CHHDR6AQ4CMGTRRRBTW";
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

// Express.js
app.use(express.static('.'))
   .use(bodyParser.json())
   .use(bodyParser.urlencoded({ extended: false }));

const Story = new WitAPI.Story({
	say(context, message) {
		console.log("saying!\n");
		this.addAnswer(message);
	},
	merge(context, entities, message) {
		// Retrieve the location entity and store it into a context field
		const intent = firstEntityValue(entities, 'intent');
		if (intent) {
			context.intent = intent;
		}
		const loc = firstEntityValue(entities, 'location');
		if (loc) {
			context.loc = loc;
		}
		const price = firstEntityValue(entities, 'price');
		if (price) {
			context.price = price;
		}
	},
	error(context, error) {
		contole.error(error);
	},

	// Custom actions
	list(context) {
		this.addAnswer("{ LIST OF HOTELS }");
	},
	roomOptions(context) {
		this.addAnswer("{ ROOM OPTIONS }");

		this.wait();
	}
});

app.get('/message', function (req, res) {
	Story.continue(req.query.message);

	Story.on("stopped", function (answers) {
		console.log(answers);
		res.json({ "answers": answers });
	});
});

app.get('/chooseRoom', function (req, res) {
	Story.setContext('hotelCode', 15);

	Story.next();
});

app.listen(port, function () {
	console.log("Chatbot listening on 127.0.0.1:" + port);
});