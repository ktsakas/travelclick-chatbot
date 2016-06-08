var app = angular.module("chatbot", []);

app.controller("msgCtrl", function ($scope, $http) {
	$scope.messages = [];

	$scope.addMessage = function () {
		// Handle user message
		$scope.messages.push({
			text: $scope.newMessage,
			type: "user"
		});

		// Handle bot answer
		$http.get("/message", {
			params: { message: $scope.newMessage }
		}).then(function (res) {
			var answers = res.data.answers;
			for (var i= 0; i < answers.length; i++) {
				$scope.messages.push({
					text: answers[i],
					type: "bot"
				});
			}
		});

		// console.log($scope.messages);
	}
});