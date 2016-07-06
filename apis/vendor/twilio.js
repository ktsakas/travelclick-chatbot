// Twilio API
var TwilioAPI = {
	client: require('twilio')(
		'AC3676e87b160d6c3cfbc0c3ebc5397aaf',  // Account SID
		'd2c68f411a37ed91a59f13ba17d5a761'     // Auth Token
	),

	from: "+15005550006",
	to: "+14016886675",

	setFrom: function (phoneNumber) {
		this.from = phoneNumber;
	},

	setTo: function (phoneNumber) {
		this.to = phoneNumber;
	},

	sendSMS: function (text) {
		this.client.messages.create({
			to: this.to,
			from: this.from,
			body: text
		}, function (err, message) {
			if (err) console.error(err);
			else console.log("message sent!");
		});
	}
};

module.exports = TwilioAPI;