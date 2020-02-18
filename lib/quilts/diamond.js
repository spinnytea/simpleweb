(function() {
	'use strict';
	// TODO unit testing
	// TODO lint

	// NOTE matrix MUST be a square
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
			cols: 5, // how many times is the matrix used, wide
			rows: 6, // how many times is the matrix used, tall
			zoom: 10, // how much to zoom the picture
		},
	});

	const quiltVue = new Vue({
		el: 'svg',
		computed: {
			baseSize: function() { return inputVue.squareSize * matrix.length; },
			quiltWidth: function() { return this.baseSize*inputVue.cols*Math.sqrt(2); },
			quiltHeight: function() { return this.baseSize*inputVue.rows*Math.sqrt(2); },

			// REVIEW how is this cached by Vue?
			list: function() {
				const quilt = [];

				// TODO make a general form
				// TODO the coordinate system is all wonky

				// top
				for(let cs = 0; cs < inputVue.cols; cs++) {
					matrix.forEach((row, r) => { row.forEach((cell, c) => {
						if(r >= c) {
							const offsetX = cs*this.baseSize;
							quilt.push({
								x: c*inputVue.squareSize + offsetX,
								y: r*inputVue.squareSize + offsetX,
								width: inputVue.squareSize,
								height: inputVue.squareSize,
								color: 'c' + cell,
							});
						}
					}) });
				}

				// bottom
				for(let cs = 0; cs < inputVue.cols; cs++) {
					matrix.forEach((row, r) => { row.forEach((cell, c) => {
						if(r <= c) {
							const offsetX = cs*this.baseSize;
							const offsetY = inputVue.rows*this.baseSize;
							quilt.push({
								x: c*inputVue.squareSize + offsetX - offsetY,
								y: r*inputVue.squareSize + offsetX + offsetY,
								width: inputVue.squareSize,
								height: inputVue.squareSize,
								color: 'c' + cell,
							});
						}
					}) });
				}

				// left
				for(let rs = 0; rs < inputVue.rows; rs++) {
					matrix.forEach((row, r) => { row.forEach((cell, c) => {
						if(r + c + 1 >= matrix.length) {
							const offsetY = rs*this.baseSize;
							quilt.push({
								x: c*inputVue.squareSize - offsetY - this.baseSize,
								y: r*inputVue.squareSize + offsetY,
								width: inputVue.squareSize,
								height: inputVue.squareSize,
								color: 'c' + cell,
							});
						}
					}) });
				}

				// right
				for(let rs = 0; rs < inputVue.rows; rs++) {
					matrix.forEach((row, r) => { row.forEach((cell, c) => {
						if(r + c + 1 <= matrix.length) {
							const offsetX = inputVue.cols*this.baseSize;
							const offsetY = rs*this.baseSize;
							quilt.push({
								x: c*inputVue.squareSize - offsetY - this.baseSize + offsetX,
								y: r*inputVue.squareSize + offsetY + offsetX,
								width: inputVue.squareSize,
								height: inputVue.squareSize,
								color: 'c' + cell,
							});
						}
					}) });
				}

				// middle (col)
				for(let cs = 0; cs < inputVue.cols; cs++) {
					for(let rs = 0; rs < inputVue.rows-1; rs++) {
						matrix.forEach((row, r) => { row.forEach((cell, c) => {
							const offsetX = cs*this.baseSize;
							const offsetY = (rs+1)*this.baseSize;
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

				// middle (row)
				for(let cs = 0; cs < inputVue.cols-1; cs++) {
					for(let rs = 0; rs < inputVue.rows; rs++) {
						matrix.forEach((row, r) => { row.forEach((cell, c) => {
							const offsetX = cs*this.baseSize;
							const offsetY = rs*this.baseSize;
							quilt.push({
								x: c*inputVue.squareSize - offsetY + offsetX,
								y: r*inputVue.squareSize + offsetY + offsetX + this.baseSize,
								width: inputVue.squareSize,
								height: inputVue.squareSize,
								color: 'c' + cell,
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