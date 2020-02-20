(function() {
	'use strict';
	// TODO unit testing
	// TODO lint

	const inputVue = new Vue({
		el: '#input',
		data: {
			matrix: [
				[4, 4, 1, 1],
				[4, 3, 1, 1],
				[2, 3, 3, 4],
				[2, 2, 4, 4],
			],
			dim: 2,
			matrixWidth: 4,
			matrixHeight: 4,

			squareSize: 1.5, // how big is the smallest square
			cols: 3, // how many times is the matrix used, wide
			rows: 4, // how many times is the matrix used, tall
			zoom: 16, // how much to zoom the picture
		},
		methods: {
			resizeMatrix: function() {
				const m = this.matrix;
				const w = +this.matrixWidth;
				const h = +this.matrixHeight;
				if(m[0].length > w) {
					m.forEach((row) => row.splice(w));
				}
				if(m.length > h) {
					m.splice(h);
				}

				const empty = new Array(w);
				empty.fill(0, 0, w);
				if(m[0].length < w) {
					m.forEach((row) => Array.prototype.push.apply(row, empty.slice(row.length)));
				}
				if(m.length < h) {
					while(m.length < h) m.push(empty.slice(0));
				}

				Vue.set(this, 'matrix', m.slice(0));
			},
			cycleMatrix: function(row, col) {
				this.setMatrix(row, col, this.matrix[row][col] + 1);
			},
			keypressMatrix: function($event, row, col) {
				// only use numbers 0 through 9
				if(48 <= $event.keyCode && $event.keyCode <= 57) {
					let value = $event.keyCode - 48;
					this.setMatrix(row, col, value);
				}
			},
			setMatrix: function(row, col, value) {
				Vue.set(this.matrix[row], col, value % 10); // force Vue to redo computed values
			},
		},
	});

	const quiltVue = new Vue({
		el: 'svg',
		data: {
			transform: '',
		},
		computed: {
			baseWidth: function() { return inputVue.squareSize * inputVue.matrix[0].length; },
			baseHeight: function() { return inputVue.squareSize * inputVue.matrix.length; },
			quiltWidth: function() { return this.baseWidth * inputVue.cols; },
			quiltHeight: function() { return this.baseHeight * inputVue.rows; },

			// REVIEW how is this cached by Vue?
			list: function() {
				const quilt = [];
				for(let cs = 0; cs < inputVue.cols; cs++) {
					for(let rs = 0; rs < inputVue.rows; rs++) {
						inputVue.matrix.forEach((row, r) => { row.forEach((cell, c) => {
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

			margin: function() { return 0.5; },
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