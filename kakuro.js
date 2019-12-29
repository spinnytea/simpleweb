(function() {
	const MIN_ROW = 1+2;
	const MAX_ROW = 1+2+3+4+5+6+7+8+9;

	const module = angular.module('kakuro', []);
	module.controller('kakuro.body.controller', [
		function SimpleWebBodyController() {
			const body = this;

			const board = body.board = loadBoard(NINE_SEVEN_EASY);
			// const board = body.board = makeBoard(3, 3);
			validateBoard(board);

			const focus = body.focus = {
				x: 0,
				y: 0,
				cell: board[0][0],
			};

			// TODO put key docs on screen
			body.handleKeys = function handleKeys($event) {
				switch($event.key) {
					case 'ArrowDown': moveFocusDown(); break;
					case 'ArrowRight': moveFocusRight(); break;
					case 'ArrowUp': moveFocusUp(); break;
					case 'ArrowLeft': moveFocusLeft(); break;
					case 'e':
						setEmpty(focus.cell);
						validateBoard(board);
						if(!!board.stats.noneCount) moveFocusDown();
						break;
					case 'c':
						setCell(focus.cell);
						validateBoard(board);
						if(!!board.stats.noneCount) moveFocusDown();
						break;
					case '1': case '2': case '3':
					case '4': case '5': case '6':
					case '7': case '8': case '9':
						setCellValue(focus.cell, +$event.key);
						validateBoard(board);
						break;
					default: console.log($event.key); break; // TODO remove
				}
			};
			function moveFocusDown(again) {
				focus.y += 1;
				if(focus.y >= board.length) {
					focus.y = 0;
					if(!again) moveFocusRight(true);
				}
				focus.cell = board[focus.y][focus.x];
			}
			function moveFocusRight(again) {
				focus.x += 1;
				if(focus.x >= board[0].length) {
					focus.x = 0;
					if(!again) moveFocusDown(true);
				}
				focus.cell = board[focus.y][focus.x];
			}
			function moveFocusUp(again) {
				focus.y -= 1;
				if(focus.y < 0) {
					focus.y = board.length-1;
					if(!again) moveFocusLeft(true);
				}
				focus.cell = board[focus.y][focus.x];
			}
			function moveFocusLeft(again) {
				focus.x -= 1;
				if(focus.x < 0) {
					focus.x = board[0].length-1;
					if(!again) moveFocusUp(true);
				}
				focus.cell = board[focus.y][focus.x];
			}
		}
	]);

	/**
	 * board[row][cell]
	 */
	function makeBoard(height, width) {
		const board = [];
		while(board.length < height) {
			const row = [];
			while(row.length < width) {
				const cell = makeCell();

				if(row.length > 0) {
					cell.$left = row[row.length-1];
					cell.$left.$right = cell;
				}

				if(board.length > 0) {
					cell.$up = board[board.length-1][row.length];
					cell.$up.$down = cell;
				}

				row.push(cell);
			}
			board.push(row);
		}
		return board;
	}
	function makeCell() {
		return {
			/**
			 * type: enum for cell types
			 *  - 'none' hasn't been specified yet
			 *  - 'empty' cannot have a value, may specify a sum down or right
			 *  - 'cell' will have a value eventually
			 */
			type: 'none',

			/**
			 * for 'empty'
			 * right: the sum of the cells to the right
			 * down: the sum of the cells down
			 */
			right: null,
			down: null,

			/**
			 * for 'cell'
			 * value: the value of cell, then one we actually picked
			 * possible: which values are possible, we widdle them down with logic
			 */
			value: null,
			possible: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true },

			/**
			 * validation errors to simplify ui feedback
			 */
			errors: {},
		};
	}

	/**
	 * during setup, mark a cell as empty
	 *
	 * XXX think of a better way to get the input than a prompt
	 */
	function setEmpty(cell) {
		cell.type = 'empty';

		let val = +prompt('Sum across the row to the right.', cell.right || '');
		if(!isNaN(val) && MIN_ROW <= val && val <= MAX_ROW) {
			cell.right = +val;
		} else {
			cell.right = null;
		}

		val = +prompt('Sum down the col below.', cell.down || '');
		if(!isNaN(val) && MIN_ROW <= val && val <= MAX_ROW) {
			cell.down = +val;
		} else {
			cell.down = null;
		}
	}
	/**
	 * mark a cell as one that should have a value
	 * clear the value of a cell
	 */
	function setCell(cell) {
		cell.type = 'cell';
		cell.value = null;
	}
	/**
	 * give a specific value to a cell
	 */
	function setCellValue(cell, value) {
		if(cell.type === 'cell') {
			cell.value = value;
		}
	}

	function validateBoard(board) {
		// REVIEW this is heavy handed, and shouldn't really be in "validate"
		board.stats = {
			noneCount: 0,
		};
		board.forEach(function(row) {
			row.forEach(function(cell) {
				validateCell(cell);
				if(cell.type === 'none') board.stats.noneCount++;
			});
		});
	}
	function validateCell(cell) {
		cell.errors['value-impossible'] = false;
		cell.errors['right-no-space'] = false;
		cell.errors['down-no-space'] = false;

		if(cell.type === 'cell') {
			if(cell.value !== null) {
				// value-impossible
				// the value isn't one of the possible values
				cell.errors['value-impossible'] = !cell.possible[cell.value];
			}
		}

		if(cell.type === 'empty') {
			// right-no-space
			// if a 'right' sum is specified, but there isn't room for it
			if(!!cell.right) {
				// if there is a right specified
				// then there must be at least 2 cells to the right
				if(
					!cell.$right || cell.$right.type !== 'cell' ||
					!cell.$right.$right || cell.$right.$right.type !== 'cell'
				) {
					cell.errors['right-no-space'] = true;
				}
			}

			// down-no-space
			// if a 'down' sum is specified, but there isn't room for it
			if(!!cell.down) {
				// if there is a down specified
				// then there must be at least 2 cells to the down
				if(
					!cell.$down || cell.$down.type !== 'cell' ||
					!cell.$down.$down || cell.$down.$down.type !== 'cell'
				) {
					cell.errors['down-no-space'] = true;
				}
			}
		}

		// TODO value-duplicate
		// the value is already used in a row or column
	}



	function loadBoard(data) {
		const board = makeBoard(data.length, data[0].length);

		for(let y = 0; y < data.length; y++) {
			for(let x = 0; x < data[0].length; x++) {
				// _.assign(board[y][x], data[y][x]);
				let d = data[y][x];
				for(let prop in d) {
					board[y][x][prop] = d[prop];
				}
			}
		}

		return board;
	}

	/* super simple sample board */
	const THREE_BY_THREE = [
		[
			{ type: 'empty' },
			{ type: 'empty', down: 12 },
			{ type: 'empty', down: 3 },
		],
		[
			{ type: 'empty', right: 11 },
			{ type: 'cell' },
			{ type: 'cell' },
		],
		[
			{ type: 'empty', right: 4 },
			{ type: 'cell' },
			{ type: 'cell' },
		],
	];

	const NINE_SEVEN_EASY = [
		[
			{ type: 'empty' },
			{ type: 'empty', down: 14 },
			{ type: 'empty', down: 4 },
			{ type: 'empty', down: 19 },
			{ type: 'empty' },
			{ type: 'empty', down: 11 },
			{ type: 'empty', down: 3 },
		],
		[
			{ type: 'empty', right: 8 },
			{ type: 'cell' },
			{ type: 'cell' },
			{ type: 'cell' },
			{ type: 'empty', right: 10 },
			{ type: 'cell' },
			{ type: 'cell' },
		],
		[
			{ type: 'empty', right: 17 },
			{ type: 'cell' },
			{ type: 'cell' },
			{ type: 'cell' },
			{ type: 'empty', right: 3, down: 19 },
			{ type: 'cell' },
			{ type: 'cell' },
		],
		[
			{ type: 'empty' },
			{ type: 'empty', down: 24 },
			{ type: 'empty', down: 30, right: 7 },
			{ type: 'cell' },
			{ type: 'cell' },
			{ type: 'cell' },
			{ type: 'empty' },
		],
		[
			{ type: 'empty', right: 30 },
			{ type: 'cell' },
			{ type: 'cell' },
			{ type: 'cell' },
			{ type: 'cell' },
			{ type: 'empty', down: 26 },
			{ type: 'empty', down: 17 },
		],
		[
			{ type: 'empty', right: 16 },
			{ type: 'cell' },
			{ type: 'cell' },
			{ type: 'empty', down: 24, right: 21 },
			{ type: 'cell' },
			{ type: 'cell' },
			{ type: 'cell' },
		],
		[
			{ type: 'empty', right: 24 },
			{ type: 'cell' },
			{ type: 'cell' },
			{ type: 'cell' },
			{ type: 'empty', down: 15, right: 17 },
			{ type: 'cell' },
			{ type: 'cell' },
		],
		[
			{ type: 'empty' },
			{ type: 'empty', right: 30 },
			{ type: 'cell' },
			{ type: 'cell' },
			{ type: 'cell' },
			{ type: 'cell' },
			{ type: 'empty' },
		],
		[
			{ type: 'empty' },
			{ type: 'empty' },
			{ type: 'empty', right: 23 },
			{ type: 'cell' },
			{ type: 'cell' },
			{ type: 'cell' },
			{ type: 'empty' },
		],
	];
})();