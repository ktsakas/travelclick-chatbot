var app = angular.module("chatbot", [/*'jsonFormatter'*/]);
var sessionId = Math.floor(Math.random() * 1000000) + 1;

app.controller("chatCtrl", function ($scope/*, $element*/, $http, $timeout) {
	// Array of all answers (bot and user)
	$scope.answers = [];
	// Whether or not the input is disabled
	$scope.disabled = false;

	// Scrolls to the bottom of the chat
	function scrollToBottom () {
		$timeout(function () {
			console.log("scrolling");
			var scroller = document.body;
			scroller.scrollTop = scroller.scrollHeight;
		});
	}

	function handleAnswers (res) {
		var answers = res.data.answers;

		/*$scope.messages[$scope.messages.length - 1].analysis = 
			res.data.analysis;*/

		console.log("answers: ", answers);
		answers.forEach(function (answer) {
			answer.owner = "bot";
			$scope.answers.push(answer);
		})
		/*for (var i= 0; i < answers.length; i++) {
			answers[i].owner = "bot";

			$scope.messages.push(answers[i]);
		}*/

		$scope.disabled = false;
		scrollToBottom();
	}

	function removeTemporary () {
		var tmps = document.getElementsByClassName("temporary");

		for (var i= 0; i < tmps.length; i++) {
			tmps[i].style.display = 'none';
		}
		// temporary
	}

	$scope.submitMessage = function () {
		$scope.addMessage($scope.newMessage);
	}

	$scope.addMessage = function (newMsg, knownEntities) {
		var equiv = $scope.equiv;

		$scope.answers.push({
			type: "msg",
			owner: "user",
			text: newMsg,
		});

		// Disable input and scroll to bottom
		$scope.disabled = true;
		scrollToBottom();
		removeTemporary();

		// Reset input values
		$scope.newMessage = "";
		$scope.equiv = null;

		// Handle server reponse
		$http.get("/chat/" + sessionId, {
			params: { message: newMsg, knownEntities: knownEntities }
		}).then(handleAnswers);

	};

	/*$scope.answers.push({
		type: "rooms",
		rooms: [{"roomId":1534,"roomTypeName":"Herman - Gerlach","roomType":"quadruple","maxOccupancy":4},{"roomId":1535,"roomTypeName":"Ratke LLC","roomType":"quadruple","maxOccupancy":4},{"roomId":1536,"roomTypeName":"Ledner - Schoen","roomType":"quadruple","maxOccupancy":4},{"roomId":1537,"roomTypeName":"Auer LLC","roomType":"quadruple","maxOccupancy":4},{"roomId":1538,"roomTypeName":"Orn - Koss","roomType":"quadruple","maxOccupancy":4}],
		owner: "bot",
	});
	
	// Test message
	$scope.answers.push({
		type: "msg",
		owner: "user",
		text: "Test user message",
	});

	$scope.answers.push({
		type: "msg",
		owner: "bot",
		text: "Test bot message",
	});

	$scope.answers.push({
		type: "yes_no",
		owner: "bot",
	});

	$scope.answers.push({
		type: "calendar",
		owner: "bot",
	});

	$scope.answers.push({
		type: "availabitlity",
		owner: "bot",
	});

	$timeout(function () {
		$scope.answers.push({
			type: "map_directions",
			owner: "bot",
		});
	}, 1000);*/
});

// Display html instead of plain text
app.filter('unsafe', function($sce) {
    return function(val) {
        return $sce.trustAsHtml(val);
    };
});

app.controller("msgCtrl", function ($scope) {});
app.controller("yesNoCtrl", function ($scope) {});