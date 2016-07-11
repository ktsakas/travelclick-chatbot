app.controller("calendarCtrl", function ($scope, $element) {
	console.log("calendar controller");

	var dateIn = null,
		dateOut = null;

	var startPicker = new Pikaday({
		field: $element[0].calendarField,
		firstDay: 1,
		minDate: new Date(2000, 0, 1),
		maxDate: new Date(2020, 12, 31),
		yearRange: [2000, 2020],
		bound: false,
		container: $element[0].getElementsByClassName('calendar')[0],
		onDraw: function () {
			$("button[data-pika-day=14]").addClass('avail');
			$("button[data-pika-day=15]").addClass('booked');


			if (dateIn && dateOut) {
				var selectDate = moment(dateIn);

				console.log("day: " + selectDate.get('date') + " -- month: " + selectDate.get('month'));
				do {
					console.log(selectDate.get('date'), dateOut.getDate());

					$("button[data-pika-day=" + selectDate.get('date') + "][data-pika-month=" + selectDate.get('month') + "]")
						.addClass('selected');

				} while (!selectDate.isSame(dateOut) && selectDate.add(1, 'days'));
			}
		},
		onSelect: function () {
			if (!dateIn) {
				dateOut = dateIn = this.getDate();
				startPicker.setMinDate(dateIn);
			} else {
				dateOut = this.getDate();
			}
		}
	});

	startPicker.setMinDate(new Date());
});

/*var endPicker = new Pikaday({
	field: document.getElementById('endDate'),
	firstDay: 1,
	minDate: new Date(2000, 0, 1),
	maxDate: new Date(2020, 12, 31),
	yearRange: [2000, 2020],
	bound: false,
	container: document.getElementById('container'),
});*/
