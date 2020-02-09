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

	var timer = new Vue({
		el: '#timer',
		data: {
			currentMillis: 0,
			total: 0,
			formattedList: [],
		},
		computed: {
			currentText: function() {
				return moment(this.currentMillis).format('h:mm:ss:SSS a');
			},
			averageText: function() {
				var avg = (this.formattedList.length === 0 ? 0 : this.total / this.formattedList.length);
				return moment(avg).diff(0, 'seconds', true);
			},
		},
		methods: {
			start: function() {
				this.currentMillis = Date.now();
				this.total = 0;
				this.formattedList.splice(0);
			},
			next: function() {
				var now = Date.now();
				var diff = now - this.currentMillis;
				this.total += diff;
				this.formattedList.push(moment(diff).diff(0, 'seconds', true));
				this.currentMillis = now;
			},
		}
	});
})();
