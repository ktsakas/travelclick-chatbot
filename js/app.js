var app = angular.module("chatbot", []);

app.controller("msgCtrl", function ($scope, $http) {
	$scope.messages = [];

	function showMessage (res) {
		var answers = res.data.answers;
		// console.log("answers: ", answers);

		for (var i= 0; i < answers.length; i++) {
			answers[i].owner = "bot";

			$scope.messages.push(answers[i]);
		}
	}

	$scope.addMessage = function () {
		// Handle user message
		$scope.messages.push({
			data: $scope.newMessage,
			type: "msg",
			owner: "user"
		});

		// Handle bot answer
		$http.get("/message", {
			params: { message: $scope.newMessage }
		}).then(showMessage);

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
});