(function() {
	function clamp(min, val, max) {
		return Math.max(min, Math.min(val, max));
	}
	var app = new Vue({
		el: '#app',
		data: {
			quest: {
				total: 50000,
				current: 10000,
				step: 380,
			},
		},
		computed: {
			questPercent: function() {
				return (clamp(0, this.quest.current / this.quest.total, 1) * 100).toFixed(1) + '%';
			},
		},
	});
})();
