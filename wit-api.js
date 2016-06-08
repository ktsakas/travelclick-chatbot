const fetch = require('node-fetch');
const uuid = require('node-uuid');
const EventEmitter = require('events').EventEmitter;
const DEFAULT_API_VERSION = '20160516';

function WitAPI (token) {
	const baseURL = process.env.WIT_URL || 'https://api.wit.ai';
	const version = process.env.WIT_API_VERSION || DEFAULT_API_VERSION;
	const headers = {
		'Authorization': 'Bearer ' + token,
		'Accept': 'application/vnd.wit.' + version + '+json',
		'Content-Type': 'application/json',
	};

	this.token = token;

	// Constructor for new stories
	function Story(actions) {
		this.context = {};
		this.sessionId = uuid.v1();
		this.actions = actions;
		this.nextAction = "";
		this.expectMessage = false;

		return this;
	}

	Story.prototype = EventEmitter.prototype;

	Story.prototype.next = function (message) {
		var q = 'session_id=' + this.sessionId;
		if (message) q += '&q=' + encodeURIComponent(message);

		fetch(baseURL + '/converse?' + q, {
			method: 'POST',
			headers: headers,
			body: JSON.stringify(this.context),
		})
		.then(response => response.json())
		.then(this.callAction.bind(this))
		.catch(this.callAction.bind(this));
	};

	Story.prototype.addAnswer = function (answer) {
		this.answers.push(answer);
	};

	Story.prototype.callAction = function (res) {
		console.log("called action!", res);
		if (res.type == "msg") {
			this.actions.say.call(this, this.context, res.msg);
		} else if (res.type == "merge") {
			this.actions.merge.call(this, this.context, res.entities, res.answer);
		} else  if (res.type == "action") {
			this.actions[res.action].call(this, this.context);
		} else if (res.type == "stop") {
			this.wait();
			return;
		}

		if (!this.stopped) this.next();
	};

	Story.prototype.continue = function (message) {
		if (!message) throw "User did not give input yet!";
		this.stopped = false;
		this.answers = [];

		// console.log(this);
		this.next(message);
	};

	Story.prototype.wait = function () {
		this.stopped = true;
		this.emit("stopped", this.answers);
	};


	return {
		Story: Story
	};
};

module.exports = WitAPI;