(function() {
	'use strict';
	// TODO unit testing
	// TODO lint

	const matrix = [
		[4, 4, 1, 1],
		[4, 3, 1, 1],
		[2, 3, 3, 4],
		[2, 2, 4, 4],
	];

	const inputVue = new Vue({
		el: '#input',
		data: {
			squareSize: 1.5, // how big is the smallest square
			cols: 3, // how many times is the matrix used, wide
			rows: 4, // how many times is the matrix used, tall
			zoom: 16, // how much to zoom the picture
		},
	});

	const quiltVue = new Vue({
		el: 'svg',
		computed: {
			baseWidth: function() { return inputVue.squareSize * matrix[0].length; },
			baseHeight: function() { return inputVue.squareSize * matrix.length; },
			quiltWidth: function() { return this.baseWidth * inputVue.cols; },
			quiltHeight: function() { return this.baseHeight * inputVue.rows; },

			// REVIEW how is this cached by Vue?
			list: function() {
				const quilt = [];
				for(let cs = 0; cs < inputVue.cols; cs++) {
					for(let rs = 0; rs < inputVue.rows; rs++) {
						matrix.forEach((row, r) => { row.forEach((cell, c) => {
							quilt.push({
								x: c*inputVue.squareSize + cs*this.baseWidth,
								y: r*inputVue.squareSize + rs*this.baseHeight,
								width: inputVue.squareSize,
								height: inputVue.squareSize,
								color: 'c'+cell,
							});
						}) });
					}
				}
				return quilt;
			},

			margin: function() { return inputVue.squareSize; },
			svgWidth: function() { return (this.quiltWidth + 2*this.margin) * inputVue.zoom; },
			svgHeight: function() { return (this.quiltHeight + 2*this.margin) * inputVue.zoom; },
			viewBox: function() { return [-this.margin, -this.margin, this.quiltWidth+2*this.margin, this.quiltHeight+2*this.margin].join(' '); },
		},
	});

	new Vue({
		el: '#metrics',
		computed: {
			squareSize: function() { return +inputVue.squareSize; },
			cutSize: function() { return this.squareSize + 1; },

			quiltWidth: function() { return quiltVue.quiltWidth; },
			quiltHeight: function() { return quiltVue.quiltHeight; },

			colors: function() {
				return quiltVue.list.reduce(function(map, cell) {
					map[cell.color] = (map[cell.color] || 0) + 1;
					return map;
				}, {});
			},
		},
	});
})();