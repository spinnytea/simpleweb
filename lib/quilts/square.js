(function() {
	'use strict';
	// TODO unit testing

	// TODO put all these constants on the UI as input controls
	const SQUARE_SIZE = 1.5; // how big is the smallest square
	const ZOOM = 10; // how much to zoom the ui

	const COLS = 3;
	const ROWS = 4;

	const matrix = [
		[4, 4, 1, 1],
		[4, 3, 1, 1],
		[2, 3, 3, 4],
		[2, 2, 4, 4],
	];
	const baseWidth = SQUARE_SIZE * matrix[0].length;
	const baseHeight = SQUARE_SIZE * matrix.length;

	const quilt = [];
	for(let cs = 0; cs < COLS; cs++) {
		for(let rs = 0; rs < ROWS; rs++) {
			matrix.forEach((row, r) => { row.forEach(function(cell, c) {
				quilt.push({
					x: c*SQUARE_SIZE + cs*baseWidth,
					y: r*SQUARE_SIZE + rs*baseHeight,
					width: SQUARE_SIZE,
					height: SQUARE_SIZE,
					color: 'c'+cell,
				});
			}) });
		}
	}

	const overallWidth = baseWidth * COLS;
	const overallHeight = baseHeight * ROWS;

	new Vue({
		el: 'svg',
		data: {
			width: overallWidth * ZOOM,
			height: overallHeight * ZOOM,
			viewBox: [0, 0, overallWidth, overallHeight].join(' '),
			list: quilt,
		},
	});

	// TODO more automatic; use numbers in matrix
	const colors = {
		'c1': quilt.reduce((sum, cell) => (cell.color === 'c1' ? sum+1 : sum), 0),
		'c2': quilt.reduce((sum, cell) => (cell.color === 'c2' ? sum+1 : sum), 0),
		'c3': quilt.reduce((sum, cell) => (cell.color === 'c3' ? sum+1 : sum), 0),
		'c4': quilt.reduce((sum, cell) => (cell.color === 'c4' ? sum+1 : sum), 0),
	};

	new Vue({
		el: '#metrics',
		data: {
			width: overallHeight,
			height: overallHeight,
			colors: colors,
		},
	});
})();