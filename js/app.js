var app = angular.module("chatbot", ['jsonFormatter']);

app.controller("msgCtrl", function ($scope, $http) {
	$scope.messages = [];

	function showMessage (res) {
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

	$scope.setRoomType = function (roomCode, roomName) {
		console.log("room", roomCode, roomName);

		$http.get("/setRoomType", {
			params: { code: roomCode, name: roomName }
		}).then(showMessage);
	}

	$scope.setDates = function (startDate, endDate) {
		startDate = new Date('02/02/2017').getTIme();
		endDate = new Date('02/05/2017').getTime();

		$http.get("/setDates", {
			params: { startDate: startDate, endDate: endDate }
		}).then(showMessage);
	}

	$http.get("/reset", { params: {} });
	engage();
});