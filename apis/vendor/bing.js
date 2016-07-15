const config = require('../../app/config.js');
	  request = require('request-promise'),
	  l = config.logger;

class BingAPI {
	/**
	 * Given a string it does spellchecking on it and returns
	 * the token that were misspelled.
	 * 
	 * @param  {string} text
	 * @return {object} The results of the spellcheck.
	 */
	static spellcheck(text) {
		return request.post({
				url: config.bing.base_url + '/spellcheck?mode=spell',
				'Ocp-Apim-Subscription-Key': config.bing.subscription_key,
				form: { text: text },
				json: true
			}).then(function (body) {
				return body.flaggedTokens;
			}).catch(function (err) {
				l.error(err);
			});
	}
};

module.exports = BingAPI;

