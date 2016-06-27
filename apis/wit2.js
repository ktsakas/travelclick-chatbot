const l = require('winston'),
	  fetch = require('node-fetch'),
	  uuid = require('node-uuid'),
	  EventEmitter = require('events').EventEmitter,
	  util = require('util'),
	  _ = require('underscore'),
	  request = require('request'),
	  moment = require('moment');

l.level = 'silly';

function WitAPI (token) {
	var version = '20160516';

	this.queryData = {
		v: version,
		session_id: uuid.v1()
	}

	this.req = request.defaults({
		baseUrl: 'https://api.wit.ai',
		headers: {
			'Authorization': 'Bearer ' + token,
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
	});

	this.context = {};
	this.actions = {};

	return this;
}

util.inherits(WitAPI, EventEmitter);

WitAPI.prototype.action = function (action, fn) {
	this.actions[action] = fn;
};

WitAPI.prototype.callAction = function (action, args, cb) {
	if (!this.actions[action]) throw "Action " + action + " does not exist!";

	var restArgs = Array.prototype.slice.call(arguments, [1]);
	// console.log("rest args: ", restArgs);
	this.actions[action].apply(this, restArgs);
};

WitAPI.prototype.query = function (text) {
	var self = this;

	// console.log("querying", self.context);
	this.req.post({
		url: "/converse",
		qs: _.defaults(text ? { q: text } : {}, this.queryData),
		body: JSON.stringify(self.context)
	}, function (err, res, body) {
		body = JSON.parse(body);
		console.log("BODY TYPE: " + body.type);
		console.log("CALLING ACTION: " + body.action);

		if (body.type == "msg") {
			// console.log("Message...");
			self.callAction('say', body.msg);
			self.query();
		} else if (body.type == "merge") {
			console.log("merge body: ", body);
			self.callAction('merge', body.entities || {}, self.context, function (mergedCtx) {
				self.context = mergedCtx;
				self.query();
			});
		} else if (body.type == "action") {
			self.callAction(body.action, self.context, function (newCtx) {
				console.log("action ctx: ", self.context);

				self.context = newCtx;
				self.query();
			});
		} else if (body.type == "stop") {
			console.log(self.context);
			self.callAction('stop');
			return;
		}
	});
}

/*var readline = require('readline'),
	rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	})

var wit = new WitAPI('LVQPYAXDQYWKFRSORXCCN3YR23S5AUQE');

wit.query('Text the hotel I will be 10 minutes late');
wit.on('merge', function (entities, context) {
	// console.log("Merge entities: ", entities);

	if (entities.intent) {
		context.intent = entities.intent[0].value;
		context[context.intent] = true;
	}

	if (entities.dateIn) {
		context.dateIn = entities.dateIn[0].value.split('T')[0];
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

	if (context.dateIn && context.nights) {
		context.dateOut = moment(context.dateIn).add(context.nights, 'd').format('YYYY-MM-DD');
	}

	
});

wit.on("say", function (message) {
	rl.question(message, function (answer) {
		wit.query(answer);
	});
});*/

module.exports = WitAPI;