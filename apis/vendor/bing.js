const config = require('../../app/config.js');
	  request = require('request-promise'),
	  l = config.logger;

/**
 * All methods are static, do not call the constructor.
 * 
 * @class     BingAPI
 * @classdesc Bing API wrapper.
 */
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
				headers: {
					'Ocp-Apim-Subscription-Key': config.bing.subscription_key,
				},
				form: { text: text },
				json: true
			}).catch(
				(err) => l.error(" -- spellcheck -- ", err)
			).then(function (body) {
				return body.flaggedTokens;
			});
	}
};

module.exports = BingAPI;

