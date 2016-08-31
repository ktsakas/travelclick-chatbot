app.component("calendar", {
	templateUrl: "partials/calendar.html",
	bindings: {
		onSelect: '&',
		dates: '<',
		selectable: '<'
	},
	controller: function ($scope, $element) {
		var $ctrl = this,
			dateIn = null,
			dateOut = null;

		$scope.init = function () {
			var picker = new Pikaday({
				field: $element.find("[name=calendarField]")[0],
				firstDay: 1,
				minDate: new Date(2000, 0, 1),
				maxDate: new Date(2020, 12, 31),
				yearRange: [2000, 2020],
				bound: false,
				container: $element[0].getElementsByClassName('calendar')[0],
				onDraw: function () {
					if ($ctrl.dates) {
						$ctrl.dates.forEach(function (day) {
							var date = day.date.split('-');

							var year = parseInt(date[0]),
								month = parseInt(date[1]) - 1,
								monthDay = parseInt(date[2]);

							// console.log("elm: ", $element[0]);
							// console.log(date, year, month, monthDay);
							/*console.log($element.find("button[data-pika-day=" + monthDay + "]"
								+ "[data-pika-month=" + month + "]"
								+ "[data-pika-year=" + year + "]"));*/

							$element.find("button[data-pika-day=" + monthDay + "]"
								+ "[data-pika-month=" + month + "]"
								+ "[data-pika-year=" + year + "]")
								.addClass(day.isAvailable ? 'avail' : 'booked');
						});
					}


					// Highlight selected dates
					if (dateIn && dateOut) {
						var selectDate = moment(dateIn);

						// console.log("day: " + selectDate.get('date') + " -- month: " + selectDate.get('month'));
						do {
							// console.log(selectDate.get('date'), dateOut.getDate());

							$element.find("button[data-pika-day=" + selectDate.get('date') + "]"
								+ "[data-pika-month=" + selectDate.get('month') + "]")
								.addClass('selected');

						} while (!selectDate.isSame(dateOut) && selectDate.add(1, 'days'));
					}
				},
				onSelect: function () {
					// Do nothing is the calendar is not selectable
					if (!$ctrl.selectable) return;

					if (!dateIn) {
						dateOut = dateIn = this.getDate();
						picker.setMinDate(dateIn);
					} else {
						dateOut = this.getDate();
					}

					if (dateIn && dateOut) {
						var datestipElm = $element[0].getElementsByClassName('rangetip')[0];

						datestipElm.innerHTML = "from " + moment(dateIn).format("MMMM Do") +
							" to " +moment(dateOut).format("MMMM Do");
					}
				}
			});


			picker.setMinDate(new Date());
		};

		$scope.clearCalendar = function () {
			console.log("clearing calendar");

			dateIn = null;
			dateOut = null;

			$("button").removeClass("selected");
		};

		$scope.selectDate = function () {
			var datestipElm = $element[0].getElementsByClassName('rangetip')[0];
			$ctrl.onSelect({ text: datestipElm.innerHTML });
			// $ctrl.sendMessage(datestipElm.innerHTML);
		};

		$scope.init();
	}
});