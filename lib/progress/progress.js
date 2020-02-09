(function() {
	function clamp(min, val, max) {
		return Math.max(min, Math.min(val, max));
	}

	function formatDuration(millis) {
		var duration = moment.duration(millis);
		var hours = '' + duration.hours();
		var minutes = ('0' + duration.minutes()).slice(-2);
		var seconds = ('0' + duration.seconds()).slice(-2);
		return hours + ':' + minutes + ':' + seconds;
	}

	var quest = new Vue({
		el: '#quest',
		data: {
			total: 50000,
			current: 10000,
			step: 380,
		},
		computed: {
			totalS: function() {
				return (+this.total) + (+this.step) - 1;
			},
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
			avg: function() {
				return (this.formattedList.length === 0 ? 0 : this.total / this.formattedList.length);
			},
			remaining: function() {
				return this.avg * quest.iterations;
			},

			currentText: function() {
				return moment(this.currentMillis).format('h:mm:ss a');
			},
			averageText: function() {
				return moment(this.avg).diff(0, 'seconds', true).toFixed(1);
			},
			remainingText: function() {
				return formatDuration(this.remaining);
			},
			endTimeText: function() {
				return moment(this.currentMillis + this.remaining).format('h:mm:ss a');
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
				this.formattedList.push(moment(diff).diff(0, 'seconds', true).toFixed(1));
				this.currentMillis = now;
				quest.current = (+quest.current) + (+quest.step);
			},
		}
	});
})();
