var app = angular.module("chatbot", ['jsonFormatter']);

var config = {
    server: 'wss://api.api.ai:4435/api/ws/query',
    token: 'e11f52814cbf49c3b34ed55f455ca11f',// Use Client access token there (see agent keys).
    // sessionId: sessionId,
    onInit: function () {
        console.log("> ON INIT use config");
    }
};
var apiAi = new ApiAi(config);
apiAi.init();

apiAi.onOpen = function () {
    apiAi.startListening();
};

app.filter('unsafe', function($sce) {
    return function(val) {
        return $sce.trustAsHtml(val);
    };
});

/*
	Chat controller
*/
app.controller("chatCtrl", function ($scope, $element, $http, $timeout) {
	$scope.messages = [];
	$scope.disabled = false;
	$scope.expectConfirm = false;

	function showMessage (res) {
		$scope.disabled = false;

		var answers = res.data.answers;
		$scope.messages[$scope.messages.length - 1].analysis = 
			res.data.analysis;

		for (var i= 0; i < answers.length; i++) {
			answers[i].owner = "bot";

			$scope.messages.push(answers[i]);
		}

		$timeout(function () {
			console.log("setting focus");
			document.getElementById('new-message').focus();

			var scroller = document.body;
      		scroller.scrollTop = scroller.scrollHeight;
		});
	}

	var engaged = false;
	var curMsg = 0;
	var engageMsgs = [
		/*{
			question: "Would you like to book a single for tonight?",
			req: "I would like to book a room for tonight for one person."
		}, {
			question: "Are you interested in booking a single for another date?",
			req: "I would like to book a room for one person."
		}*/
	];
	var defMsg = 
	"Hey, I am a chatbot let me know if you need help with any of the following."
	+ "<ul>"
	+ "<li>Booking a room</li>"
	+ "<li>Ask information about the hotel and our rooms</li>"
	+ "<li>Ask about availability</li>"
	+ "<li>Get our address or directions</li>"
	+ "<li>Contact the hotel</li>";

	function parseYesNo (msg) {
		if (!msg) return false;

		if (msg.match(/(yes|yeah|yep|sure).*/i)) {
			return true;
		} else if (msg.match(/(no).*/i)) {
			return false;
		} else {
			return null;
		}
	}

	function engage (msg) {
		if (parseYesNo(msg)) {
			engaged = true;
			return engageMsgs[curMsg - 1].req;
		} else {
			var nextQ = engageMsgs[curMsg] ? engageMsgs[curMsg].question : defMsg;
			curMsg++;

			if (curMsg > engageMsgs.length) engaged = true;

			/*$scope.messages.push({
				text: nextQ,
				type: "msg",
				owner: "bot"
			});*/

			return null;
		}
	}

	$scope.addMessage = function () {
		console.log("new msg confirm: ", $scope);
		var lastMessage = $scope.messages[ $scope.messages.length - 1 ];
		console.log("last message: ", lastMessage);
		var sendMessage;

		// Handle user message
		$scope.messages.push({
			text: $scope.newMessage,
			type: "msg",
			owner: "user",
			showAnalysis: false
		});

		if ($scope.expectConfirm) {
			var confirm = parseYesNo($scope.newMessage);
			if ( confirm === true ) {
				$scope.expectConfirm = false;
				$http.get("/chat", {
					params: { message: lastMessage.equiv }
				}).then(showMessage);
			} else if ( confirm === false ) {
				console.log("false");

				$scope.expectConfirm = false;
				$scope.messages.push({
					type: "msg",
					owner: "bot",
					text: "Ok, is there anything else I could help you with?"
				});
			} else if ( confirm === null ) {
				$scope.messages.push({
					type: "msg",
					owner: "bot",
					text: "Please answer yes or no."
				})
			}

		} else {
			$scope.disabled = true;
			document.getElementById('new-message').value = "";

			$http.get("/chat", {
				params: { message: $scope.newMessage }
			}).then(showMessage);
		}

		$timeout(function () {
			var scroller = document.body;
      		scroller.scrollTop = scroller.scrollHeight;
		});

		// console.log($scope.messages);
	}

	console.log('resetting');
	$http.get("/reset", { params: {} });
	engage();
});


function dateToDay (dateStr) {
	console.log(dateStr);
	var parts = dateStr.split('-'),
		date = new Date(+parts[0], parts[1] - 1, +parts[2]);

	return date.getDay();
}

/*
	Chat single message controller
*/
app.controller("msgCtrl", function ($scope, $element, $location) {
	var map;
	console.log("message ctrl", $scope);
	if ($scope.msg.type == 'location' || $scope.msg.type == 'directions') {
		map = new google.maps.Map($element[0].getElementsByClassName("map")[0], {
            zoom: 13,
            center: $scope.msg.location,
            disableDefaultUI: true
        });
	}

	if ($scope.msg.type == "location") {
		console.log("location: ", $scope.msg.location);
        var marker = new google.maps.Marker({
            position: $scope.msg.location,
            map: map,
            title: "Hotel"
        });
	} else if ($scope.msg.type == 'directions') {
        var directionsService = new google.maps.DirectionsService;
        var directionsDisplay = new google.maps.DirectionsRenderer;
        directionsDisplay.setMap(map);

        directionsService.route({
            /*origin: {
                lat: 37.8386741,
                lng: -122.2936934
            },*/
            origin: "JFK Airport",
            destination: "Port Authority Bus Terminal",
            travelMode: google.maps.TravelMode.DRIVING
        }, function(response, status) {
        	var steps = response.routes[0].legs[0].steps;
        	console.log("legs: ", response.routes[0].legs);
            $scope.messages.push({
            	owner: "bot",
            	type: "directions-steps",
            	steps: steps
            });
            $scope.$apply();

            if (status === google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });
	} else if ($scope.msg.type == 'availability') {
		$scope.dayRanges = new Array(6).fill([]).map(function () {
			return new Array(7).fill({ num: 0, class: "empty" });
		});

		var startOffset = dateToDay($scope.msg.dates[0].date);
		var totalDays = $scope.msg.dates.length;
		for (var i= 0; i < totalDays; i++) {
			var rangeIdx = Math.floor((startOffset + i) / 7);
			var dayIdx = (startOffset + i) % 7;
			// console.log('r: ' + rangeIdx + ', d: ' + dayIdx + ', ' + i);

			$scope.dayRanges[rangeIdx][dayIdx] = {
				num: i + 1,
				class: $scope.msg.dates[i].isAvailable ? "avail" : "booked"
			};
			// console.log("r: " + rangeIdx, JSON.stringify($scope.dayRanges[rangeIdx]));
		}
		// console.log($scope.dayRanges);
	} else if ($scope.msg.type == 'rooms') {
		console.log('rooms');
	} else if ($scope.msg.type == 'directions-steps') {

		console.log('directions-steps');
	} else if ($scope.msg.type == 'prompt') {
		// Using $parent makes the override visisble on the chat scope
		$scope.$parent.$parent.expectConfirm = true;
	} else if ($scope.msg.type == 'redirect') {
		window.location = $scope.msg.url;
	}
});