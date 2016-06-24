const _ = require('underscore');
const request = require('request');
const moment = require('moment');

var Availability = {
	hotelCode: 1098,

	parseOptions: function (params) {
		/*
			Parse Dates
		*/
		var dateIn = params['dateIn'],
			nights = params['nights'],
			datePeriod = params['datePeriod'];

		if (datePeriod != "") {
			console.log('datePeriod: ', datePeriod);
			var datePeriod = params['datePeriod'].split('/');
			params['dateIn'] = datePeriod[0];
			params['nights'] = {
				number: moment(datePeriod[1], "YYYY-MM-DD").diff(params['dateIn'], 'days')
			};
			// console.log(moment(params['dateIn'], "YYYY-MM-DD").toString(),
				// moment(datePeriod[1], "YYYY-MM-DD").toString());
		} else if (dateIn != "" && nights != "") {
			var dateOut = moment(dateIn, "YYYY-MM-DD").add(+nights.number, 'd').format("YYYY-MM-DD");
			params['datePeriod'] = dateIn + "/" + dateOut;
		}

		/*
			Parse Guests
		*/
		var roomTypes = ['single', 'double', 'triple'],
			guests = params['guests'],
			roomType = params['roomType'];

		if (guests != "") {
			params['roomType'] = roomTypes[guests.number - 1];
		} else if (roomType != "") {
			if (roomType.match(/single/i)) {
				params['guests'] = { number: 1 };
			} else if (roomType.match(/double/i)) {
				params['guests'] = { number: 2 };
			} else if (roomType.match(/triple/i)) {
				params['guests'] = { number: 3 };
			}
		}

		return {
			dateIn: dateIn,
			dateOut: dateOut,
			adults: params['guests']
		};
	},

	get: function (options, cb) {
		options.rooms = 1;

		request.get({
			url: "http://ibeapil01-t5.ilcb.tcprod.local:8090/ibe/v1/hotel/1098/basicavail",
			qs: options
		}, function (err, res, body) {
			console.log("getting availability");//, err, JSON.parse(body));

			if (err) cb(err, false);
			else {
				var availability = _.map(JSON.parse(body).dates, (date) => {
					// console.log("get availability" + date.date);

					return {
						date: date.date,
						isAvailable: date.isAvailable,
						price: date.rate.minRate
					};
				});

				cb(null, availability);
			}
		});
	}/*,

	check: function (options, cb) {
		this.get(this.parseOptions(options), function (err, dates) {
			if (err) cb(err, false);
			else {
				cb( null, _(dates).every((date) => date.isAvailable) );
			}
		});
	}*/
};

/*Availability.get({
	dateIn: "2016-10-10",
	dateOut: "2016-10-13",
	adults: 2
}, function (err, dates) {
	console.log(dates);
});

Availability.check({
	dateIn: "2016-10-10",
	dateOut: "2016-10-13",
	adults: 2
}, function (err, isAvailable) {
	console.log("Is available? " + isAvailable);
});*/

module.exports = Availability;