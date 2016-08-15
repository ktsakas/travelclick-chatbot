app.controller("calendarCtrl", {
	templateUrl: "partials/calendar.html"
	controller: function ($scope, $element) {
		var dateIn = null,
			dateOut = null;

		$scope.init = function () {
			var picker = new Pikaday({
				field: $element[0].calendarField,
				firstDay: 1,
				minDate: new Date(2000, 0, 1),
				maxDate: new Date(2020, 12, 31),
				yearRange: [2000, 2020],
				bound: false,
				container: $element[0].getElementsByClassName('calendar')[0],
				onDraw: function () {
					console.log("answer type: ", $scope.answer.type)

					if ($scope.answer.type == 'availability') {
						var date = $scope.answer.dates;

						$scope.answer.dates.forEach(function (day) {
							date = day.date.split('-');

							var year = parseInt(date[0]),
								month = parseInt(date[1]) - 1,
								monthDay = parseInt(date[2]);

							console.log(date, year, month, monthDay);
							console.log($element.find("button[data-pika-day=" + monthDay + "]"
								+ "[data-pika-month=" + month + "]"
								+ "[data-pika-year=" + year + "]"));

							$element.find("button[data-pika-day=" + monthDay + "]"
								+ "[data-pika-month=" + month + "]"
								+ "[data-pika-year=" + year + "]")
								.addClass(day.isAvailable ? 'avail' : 'booked');
						});
					}

					$element.find("button[data-pika-day=14]").addClass('avail');
					$element.find("button[data-pika-day=15]").addClass('booked');


					if (dateIn && dateOut) {
						var selectDate = moment(dateIn);

						// console.log("day: " + selectDate.get('date') + " -- month: " + selectDate.get('month'));
						do {
							// console.log(selectDate.get('date'), dateOut.getDate());

							$element.find("button[data-pika-day=" + selectDate.get('date') + "][data-pika-month=" + selectDate.get('month') + "]")
								.addClass('selected');

						} while (!selectDate.isSame(dateOut) && selectDate.add(1, 'days'));
					}
				},
				onSelect: function () {
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
			$scope.sendMessage(datestipElm.innerHTML);
		};

		$scope.init();
	}
);