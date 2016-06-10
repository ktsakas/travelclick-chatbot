const l = require('winston');
l.level = 'silly';

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
		this.stopped = false;

		return this;
	}

	Story.prototype = EventEmitter.prototype;

	function queryProp(object, query) {
		query = query.split(".");

		for (var i= 0; i < query.length; i++) {
			if ( object.hasOwnProperty(query[i]) ) {
				object = object[query[i]];
			} else {
				l.error("Property " + query[i] + " not found in object!");
				return null;
			}
		}

		return object;
	}

	function setObjectPathValue(source, path, value) {
		var parts = path.split('.'), len = parts.length, target = source;

		for (var i = 0, part; i < len - 1; i++) {
			part = parts[i];
			target = target[part] == undefined ? (target[part] = {}) : target[part];
		}
		target[parts[len - 1]] = value;
		return target;
	}

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
		// console.log("called action!", res);
		l.debug("action call type: ", res.type);
		if (res.type == "msg") {
			this.actions.say.call(this, this.context, res.msg);
		} else if (res.type == "merge") {
			this.actions.merge.call(this, this.context, res.entities, res.answer);
		} else  if (res.type == "action") {
			var action = queryProp(this.actions, res.action);

			if (action) action.call(this, this.context);
			else return;
		} else if (res.type == "stop") {
			this.wait();
			return;
		}

		l.debug("has stopped: ", this.stopped, "\n");
		if (!this.stopped) this.next();
	};

	Story.prototype.continue = function (message) {
		this.stopped = false;
		this.answers = [];

		// console.log(this);
		this.next(message);
	};

	Story.prototype.wait = function () {
		this.stopped = true;
		this.emit("stopped", this.answers, this.context);
		console.log("emmited stopped!\n");
	};

	Story.prototype.set = function (property, value) {
		this.context[property] = value;
	};


	return {
		Story: Story
	};
};

module.exports = WitAPI;