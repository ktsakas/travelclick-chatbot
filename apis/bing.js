const request = require('request').defaults({
	headers: {
		'Ocp-Apim-Subscription-Key': '1936e4b6536b4de49addb18f2d4ae22b'
	}
});

var BingAPI = {
	spellcheck: function (text, cb) {
		request.post({
			url: 'https://bingapis.azure-api.net/api/v5/spellcheck?mode=proof',
			form: { text: text }
		},
			function(err, res, body) {
				cb(err, body);
			}
		);
	}
};

module.exports = BingAPI;

