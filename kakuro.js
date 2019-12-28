(function() {
	const module = angular.module('kakuro', []);

	module.controller('kakuro.body.controller', [
		function SimpleWebBodyController() {
			const vm = this;

			vm.message = 'hello kakuro';
		}
	]);
})();