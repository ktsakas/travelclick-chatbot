var app = angular.module("chatbot", ['jsonFormatter']);

/*
	Chat controller
*/
app.controller("chatCtrl", function ($scope, $element, $http) {
	$scope.messages = [];
	$scope.disabled = false;

	function showMessage (res) {
		$scope.disabled = false;

		var answers = res.data.answers;
		$scope.messages[$scope.messages.length - 1].analysis = 
			res.data.analysis;

		for (var i= 0; i < answers.length; i++) {
			answers[i].owner = "bot";

			$scope.messages.push(answers[i]);
		}
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
	var defMsg = "Is there anything else I could help you with?";

	function parseYesNo (msg) {
		if (!msg) return false;

		if (msg.match(/(yes|yeah|yep|sure).*/i)) {
			return true;
		} else if (msg.match(/(no).*/i)) {
			return false;
		} else {
			throw "Unknown answer!";
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

			$scope.messages.push({
				text: nextQ,
				type: "msg",
				owner: "bot"
			});

			return null;
		}
	}

	$scope.addMessage = function () {
		$scope.disabled = true;
		document.getElementById('new-message').value = "";
		// Handle user message
		$scope.messages.push({
			text: $scope.newMessage,
			type: "msg",
			owner: "user",
			showAnalysis: false
		});

		// Handle bot answer
		var sendMessage;
		if (!engaged) sendMessage = engage($scope.newMessage);
		else sendMessage = $scope.newMessage;

		if (sendMessage) {
			$http.get("/message", {
				params: { message: sendMessage }
			}).then(showMessage);
		}

		console.log($scope.messages);
	}

	$http.get("/reset", { params: {} });
	engage();
});


/*
	Chat single message controller
*/
app.controller("msgCtrl", function ($scope, $element) {
	var map;
	console.log($scope.msg.type);
	if ($scope.msg.type == 'location' || $scope.msg.type == 'directions') {
		map = new google.maps.Map($element[0].getElementsByClassName("map")[0], {
            zoom: 12,
            center: $scope.msg.location,
            disableDefaultUI: true
        });
	}

	if ($scope.msg.type == "location") {
		console.log($scope.msg.location);

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
            origin: {
                lat: 37.8386741,
                lng: -122.2936934
            },
            destination: "Sacramento",
            travelMode: google.maps.TravelMode.DRIVING
        }, function(response, status) {
            console.log(response, status);

            if (status === google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });
	}
});