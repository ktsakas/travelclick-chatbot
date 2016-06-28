const l = require('winston'),
	  uuid = require('node-uuid'),
	  EventEmitter = require('events').EventEmitter,
	  util = require('util'),
	  request = require('request'),
	  _ = require('underscore'),
	  moment = require('moment');

l.level = 'silly';

function WitAPI (token) {
	var version = '20160516';

	this.queryData = {
		v: version,
		session_id: uuid.v1()
	};

	this.req = request.defaults({
		baseUrl: 'https://api.wit.ai',
		headers: {
			'Authorization': 'Bearer ' + token,
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
	});

	this.context = {};

	// this.actions = actions;
	this.actions = {};

	return this;
}

util.inherits(WitAPI, EventEmitter);

WitAPI.prototype.query = function (text, params) {
	var self = this;
	console.log("query: ", self.context);

	this.req.post({
		url: "/converse",
		qs: _.defaults({ q: text }, this.queryData),
		form: self.context
	}, function (err, res, body) {
		console.log("res: ", res);
		body = JSON.parse(body);

		if (body.type == "msg") {
			self.emit('say', body.msg);
		} else if (body.type == "merge") {
			self.emit('merge', body.entities, self.context);
			self.query(text, params);
		} else  if (body.type == "action") {
			self.emit(body.action, self.context);
		} else if (body.type == "stop") return;
	});
};

/*var readline = require('readline'),
	rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

var wit = new WitAPI('LVQPYAXDQYWKFRSORXCCN3YR23S5AUQE');

wit.query("I would like to book a room.");
wit.on("merge", function (entities, context) {
	console.log(context);
	if (entities.intent) context.intent = entities.intent[0].value;

	// Parse date
	if (entities.dateIn) {
		context.dateIn = entities.dateIn[0].value.split('T')[0];
	}
})

wit.on("say", function (msg) {
	rl.question(msg, (answer) => {
		wit.query(answer);
	});
});

wit.on("book", function (context) {});*/

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

module.exports = WitAPI;