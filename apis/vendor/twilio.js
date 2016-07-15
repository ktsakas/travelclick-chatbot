const config = require("../apis/vendor/twillio.js"),
	  l = config.logger;	  

// Twilio API
var twilioClient = require('twilio')(config.twillio.account_sid, config.twillio.auth_token),
	fromNumber = "+15005550006",
	toNumber = "+14016886675";

class TwilioAPI {
	/**
	 * Send a text message using the Twillio API.
	 * 
	 * @param  {string} Text message to send.
	 * @return {promise} Promise that resolves to twillio response.
	 */
	static sendSMS(text) {
		twilioClient.messages.create({
			to: toNumber,
			from: fromNumber,
			body: text
		}, function (err, message) {
			if (err) console.error(err);
			else console.log("message sent!");
		});
	}
};

module.exports = TwilioAPI;