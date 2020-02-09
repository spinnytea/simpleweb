(function() {
	function clamp(min, val, max) {
		return Math.max(min, Math.min(val, max));
	}
	var quest = new Vue({
		el: '#quest',
		data: {
			total: 50000,
			current: 10000,
			step: 380,
		},
		computed: {
			percent: function() {
				return (clamp(0, this.current / this.total, 1) * 100).toFixed(1) + '%';
			},
			iterations: function() {
				return Math.ceil((this.total - this.current) / this.step);
			},
		},
	});
})();
