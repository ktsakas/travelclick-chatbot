const request = require('request');
const _ = require('underscore');

var HotelInfo = {
	port: process.env.PORT || 3000,

	getInfo: function (hotelCode, info, cb) {
		request.get({
			url : "http://localhost:" + this.port + "/hotel/" + hotelCode + "/info",
			// url: this.baseUrl + "hotel/" + hotelCode + "/info",
			options: {},
			json: true
		}, function (err, res, body) {
			console.log("position: ", err, body);
			if (err) {
				return cb(err, false);
			}

			var value;
			if (info == 'phone') {
				value = _.find(body.address.telephone, function (phone) {
					return phone.phoneTechType == 'Voice';
				}).phoneNumber;
			} else if (info == 'fax') {
				value = _.find(body.address.telephone, function (phone) {
					return phone.phoneTechType == 'Fax';
				}).phoneNumber;
			} else if (info == 'position') {
				value = body.position;
			} else if (info == 'checkIn') {
				value = body.policies.policyInfo.checkInTime;
			} else if (info == 'checkOut') {
				value = body.policies.policyInfo.checkOutTime;
			} else {
				value = 'not found';
			}

			cb(null, value);
		});
	}
};

module.exports = HotelInfo;

