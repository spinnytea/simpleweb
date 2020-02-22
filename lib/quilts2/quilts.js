(function() {
	'use strict';
	// TODO unit testing
	// TODO lint

	const inputVue = new Vue({
		el: '#input',
		data: {
			squareSize: 3, // how big is the smallest square
			zoom: 16, // how much to zoom the picture

			quiltWidth: 10,
			quiltHeight: 16,
		},
		computed: {
		},
		methods: {
		},
	});

	const quiltVue = new Vue({
		el: 'svg',
		data: {
			transform: '',

			list: [],
		},
		computed: {
			quiltWidth: function() { return +inputVue.quiltWidth; },
			quiltHeight: function() { return +inputVue.quiltHeight; },

			margin: function() { return 0.5; },
			svgWidth: function() { return (this.quiltWidth + 2*this.margin) * inputVue.zoom; },
			svgHeight: function() { return (this.quiltHeight + 2*this.margin) * inputVue.zoom; },
			viewBox: function() { return [-this.margin, -this.margin, this.quiltWidth+2*this.margin, this.quiltHeight+2*this.margin].join(' '); },
		},
	});

	const metricsVue = new Vue({
		el: '#metrics',
		computed: {
			squareSize: function() { return +inputVue.squareSize; },
			cutSize: function() { return this.squareSize + 1; },
			quiltWidth: function() { return +inputVue.quiltWidth; },
			quiltHeight: function() { return +inputVue.quiltHeight; },
		},
	});
})();