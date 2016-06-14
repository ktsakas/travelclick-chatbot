/*
	Chat library for sequential questions and answers,
	without the use of websockets
*/
function SequentialChat() {
	this.responses = [];
	this.unsent = [];

	return this;
}

SequentialChat.prototype.addResponse = function (response) {
	this.unsent.push(response);
};

SequentialChat.prototype.popUnsent = function () {
	var results = this.unsent.slice(); // Copy
	this.responses = this.responses.concat(this.unsent);
	this.unsent = [];

	return results;
};

module.exports = SequentialChat;