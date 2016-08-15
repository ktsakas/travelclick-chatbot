var app = angular.module("chatbot", [/*'jsonFormatter'*/]);
var sessionId = Math.floor(Math.random() * 1000000) + 1;

app.component("message", { templateUrl: "/partials/message.html" });
app.component("yes-no", { templateUrl: "/partials/yes-no.html" });
app.component("help", { templateUrl: "/partials/help.html" });

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

	function showAnswers (res) {
		var answers = res.data.answers;

		answers.forEach(function (answer) {
			answer.owner = "bot";
			$scope.answers.push(answer);
		})

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
		$scope.sendMessage($scope.newMessage);
	};

	$scope.sendMessage = function (newMsg, knownEntities) {
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
		}).then(showAnswers);

	};

	$scope.answers.push({
		type: "msg",
		owner: "bot",
		text: "Hey, I am a chatbot. Here are some things you can ask me: ",
	});

	$scope.answers.push({
		type: "help",
		owner: "bot"
	});

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