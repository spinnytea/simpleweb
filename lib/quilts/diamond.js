(function() {
	'use strict';
	// TODO unit testing
	// TODO lint

	const inputVue = new Vue({
		el: '#input',
		data: {
			// NOTE matrix MUST be a square
			matrix: [
				[0, 0, 0, 0],
				[0, 0, 0, 0],
				[0, 0, 0, 0],
				[0, 0, 0, 0],
			],
			dim: 1,
			offset: false,
			matrixSize: 4,

			squareSize: 1.5, // how big is the smallest square
			cols: 5, // how many times is the matrix used, wide
			rows: 6, // how many times is the matrix used, tall
			zoom: 10, // how much to zoom the picture
		},
		methods: {
			resizeMatrix: function() {
				const m = this.matrix;
				const s = +this.matrixSize;

				if(m.length > s) {
					m.splice(s);
					m.forEach((row) => row.splice(s));
				}

				const empty = new Array(s);
				empty.fill(0, 0, s);
				if(m.length < s) {
					m.forEach((row) => Array.prototype.push.apply(row, empty.slice(row.length)));
					while(m.length < s) m.push(empty.slice(0));
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
			transform: 'rotate(-45 0 0)',
		},
		computed: {
			baseSize: function() { return inputVue.squareSize * inputVue.matrix.length; },
			quiltWidth: function() { return this.baseSize*inputVue.cols*Math.sqrt(2); },
			quiltHeight: function() { return this.baseSize*inputVue.rows*Math.sqrt(2); },

			// REVIEW how is this cached by Vue?
			list: function() {
				const quilt = [];

				// cols
				for(let cs = 0; cs < inputVue.cols; cs++) {
					for(let rs = 0; rs <= inputVue.rows; rs++) {
						inputVue.matrix.forEach((row, r) => { row.forEach((cell, c) => {
							// truncate top
							if(rs === 0 && r < c) return;
							// truncate bottom
							if(rs === +inputVue.rows && r > c) return;

							const offsetX = cs*this.baseSize;
							const offsetY = rs*this.baseSize;
							quilt.push({
								x: c*inputVue.squareSize - offsetY + offsetX,
								y: r*inputVue.squareSize + offsetY + offsetX,
								width: inputVue.squareSize,
								height: inputVue.squareSize,
								color: 'c' + cell,
							});
						}) });
					}
				}

				// rows
				const matrixThreshold = (inputVue.offset ? 2 : 1);
				for(let cs = 0; cs <= inputVue.cols; cs++) {
					for(let rs = 0; rs < inputVue.rows; rs++) {
						inputVue.matrix.forEach((row, r) => { row.forEach((cell, c) => {
							// truncate left
							if(cs === 0 && r + c + matrixThreshold < inputVue.matrix.length) return;
							// truncate right
							if(cs === +inputVue.cols && r + c + matrixThreshold > inputVue.matrix.length) return;

							const offsetX = cs*this.baseSize;
							const offsetY = rs*this.baseSize;
							quilt.push({
								x: c*inputVue.squareSize - offsetY + offsetX - this.baseSize,
								y: r*inputVue.squareSize + offsetY + offsetX,
								width: inputVue.squareSize,
								height: inputVue.squareSize,
								color: 'c' + cell,
							});
						}) });
					}
				}

				if(inputVue.offset) {
					const r = +inputVue.matrixSize - 1;
					const c = +inputVue.matrixSize - 1;
					const cs = -1;
					const cell = inputVue.matrix[r][c];
					for(let rs = 0; rs <= inputVue.rows; rs++) {
						const offsetX = cs*this.baseSize;
						const offsetY = rs*this.baseSize;
						quilt.push({
							x: c*inputVue.squareSize - offsetY + offsetX,
							y: r*inputVue.squareSize + offsetY + offsetX,
							width: inputVue.squareSize,
							height: inputVue.squareSize,
							color: 'c' + cell,
						});
					}

					const adjust = inputVue.squareSize / 2;
					quilt.forEach((cell) => {
						cell.x += adjust;
						cell.y += adjust;
					});
				}

				return quilt;
			},

			margin: function() { return +inputVue.squareSize; },
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

			quiltWidth: function() { return quiltVue.quiltWidth.toFixed(2); },
			quiltHeight: function() { return quiltVue.quiltHeight.toFixed(2); },

			colors: function() {
				return quiltVue.list.reduce(function(map, cell) {
					map[cell.color] = (map[cell.color] || 0) + 1;
					return map;
				}, {});
			},
		},
	});
})();