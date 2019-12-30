(function() {
	'use strict';
	const MIN_ROW = 1+2;
	const MAX_ROW = 1+2+3+4+5+6+7+8+9;

	const module = angular.module('kakuro', []);
	module.controller('kakuro.body.controller', [
		function SimpleWebBodyController() {
			const body = this;

			/* either make new */
			// const board = body.board = makeBoard(16, 14);
			// body.showSetup = true;

			/* or load existing */
			const board = body.board = loadBoard(FOURTEEN_SIXTEEN_MEDIUM);
			body.showSetup = false;

			/* and then setup */
			calcStats(board);
			validateBoard(board);

			const focus = body.focus = {
				x: 0,
				y: 0,
				cell: board[0][0],
			};

			body.handleKeys = function handleKeys($event) {
				switch($event.key) {
					case 'ArrowDown': moveFocusDown(); break;
					case 'ArrowRight': moveFocusRight(); break;
					case 'ArrowUp': moveFocusUp(); break;
					case 'ArrowLeft': moveFocusLeft(); break;
					case 'r': heuristic(board); break;
					case 'e':
						setEmpty(focus.cell);
						calcStats(board);
						validateBoard(board);
						if(!!board.stats.noneCount) moveFocusDown();
						break;
					case 'c':
						setCell(focus.cell);
						calcStats(board);
						validateBoard(board);
						if(!!board.stats.noneCount) moveFocusDown();
						else heuristic(board);
						break;
					case '1': case '2': case '3':
					case '4': case '5': case '6':
					case '7': case '8': case '9':
						setCellValue(focus.cell, +$event.key);
						heuristic(board);
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

			body.possibleValues = possibleValues;

			body.save = function() {
				body.saveStr = JSON.stringify(saveBoard(board));
				setTimeout(function() {
					/* Get the text field */
					const copyText = document.getElementById("copyText");

					/* Select the text field */
					copyText.select();
					copyText.setSelectionRange(0, 99999); /*For mobile devices*/

					/* Copy the text inside the text field */
					document.execCommand("copy");

					// TODO ui feedback, "copied to clipboard"
				});
			};
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
			rightLength: null,
			downLength: null,

			/**
			 * for 'cell'
			 * value: the value of cell, then one we actually picked
			 * possible: which values are possible, we widdle them down with logic
			 * TODO refactor possible booleans
			 *  - each heuristic sets this to "false", if we do circular logic or change input, then we need to start from scratch
			 *  - if one heuristic changes it back to "true", we need to run all the others again to see if any of them are false
			 *  - this was originally designed to only ever take the value to false
			 *  ---
			 *  - maybe this always has to happen
			 *  - the only variability after we start is changing the value of a cell
			 *  - if it goes from null -> number, then it's fine
			 *  - but if it goes from number -> number or number -> null, then we have to redo all the heuristics anyway
			 * $rightHead: the cell that labels this row
			 * $downHead: the cell that labels this col
			 */
			value: null,
			possible: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true },
			$rightHead: null,
			$downHead: null,

			/**
			 * errors: validation errors to simplify ui feedback
			 */
			errors: {},
		};
	}
	function forEachBoard(board, callback) {
		board.forEach(function(row) {
			row.forEach(function(cell) {
				callback(cell);
			});
		});
	}
	function forEachCell(cell, dir, callback) {
		let next = cell[dir];
		while(next && next.type === 'cell') {
			if(callback(next) === false) return;
			next = next[dir];
		}
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

	function calcStats(board) {
		// REVIEW board.stats impl is heavy handed
		board.stats = {
			noneCount: 0,
			cellNoValueCount: 0, // TODO calc and use (to know when the game has been won)
		};

		forEachBoard(board, function(cell) {
			if(cell.type === 'none') board.stats.noneCount++;
			if(cell.type === 'empty') {
				cell.rightLength = 0;
				if(!!cell.right) {
					forEachCell(cell, '$right', (next) => {
						cell.rightLength++;
						next.$rightHead = cell;
					});
				}

				cell.downLength = 0;
				if(!!cell.down) {
					forEachCell(cell, '$down', (next) => {
						cell.downLength++;
						next.$downHead = cell;
					});
				}
			}
			if(cell.type !== 'cell') {
				cell.$rightHead = null;
				cell.$downHead = null;
			}
		});
	}

	function possibleValues(cell, dir) {
		if(!cell || cell.type !== 'empty' && !!cell[dir] && !!cell[dir+'Length']) return [];

		// the list of numbers that have already been entered
		const nums = [];
		forEachCell(cell, '$'+dir, (next) => {
			if(!!next.value) nums.push(next.value);
		});

		// during setup, the cols/rows aren't complete, they may not have the right length or sum
		// we don't have access to the stats to check the noneCount, so we can't simply obstain until the end
		if(!POSSIBLE_VALUES[cell[dir+'Length']]) return [];
		if(!POSSIBLE_VALUES[cell[dir+'Length']][cell[dir]]) return [];

		return POSSIBLE_VALUES[cell[dir+'Length']][cell[dir]].filter(function(list) {
			// filter lists based on numbers in dir
			return nums.every(function(num) {
				return list.indexOf(num) !== -1;
			});
		});
	}

	function heuristic(board) {
		heuristic_reset(board);
		heuristic_value(board);
		heuristic_lengthAndSum(board);
	}

	/* reset the possible values back to true */
	function heuristic_reset(board) {
		forEachBoard(board, function(cell) {
			if(cell.type === 'cell') {
				for(let n = 1; n <= 9; n++)
					cell.possible[n] = true;
			}
		});
	}

	/* update cell.possible based on numbers that have alrady been entered */
	function heuristic_value(board) {
		forEachBoard(board, function(cell) {
			if(cell.type === 'empty') {
				if(!!cell.right) {
					// collect the numbers
					let nums = {};
					forEachCell(cell, '$right', (next) => {
						if(!!next.value) nums[next.value] = true;
					});
					nums = Object.keys(nums).map((num) => +num);

					// disallow the values
					forEachCell(cell, '$right', (next) => {
						nums.forEach(function(num) {
							if(next.value !== num) next.possible[num] = false;
						});
					});
				}

				if(!!cell.down) {
					// collect the numbers
					let nums = {};
					forEachCell(cell, '$down', (next) => {
						if(!!next.value) nums[next.value] = true;
					});
					nums = Object.keys(nums).map((num) => +num);

					// disallow the values
					forEachCell(cell, '$down', (next) => {
						nums.forEach(function(num) {
							if(next.value !== num) next.possible[num] = false;
						});
					});
				}
			}
		});
	}

	/* update cell.possible based on the numbers that are possible for the length/sum of a row/col */
	function heuristic_lengthAndSum(board) {
		forEachBoard(board, function(cell) {
			if(cell.type === 'empty') {
				if(!!cell.right) {
					const lists = possibleValues(cell, 'right');

					// collect all the possible numbers
					const nums = {};
					lists.forEach((list) => {
						list.forEach((num) => {
							nums[num] = true;
						});
					});

					// mark numbers as impossible
					forEachCell(cell, '$right', (next) => {
						for(let num = 1; num <= 9; num++) {
							if(!nums[num]) next.possible[num] = false;
						}
					});
				}

				if(!!cell.down) {
					const lists = possibleValues(cell, 'down');

					// collect all the possible numbers
					const nums = {};
					lists.forEach((list) => {
						list.forEach((num) => {
							nums[num] = true;
						});
					});

					// mark numbers as impossible
					forEachCell(cell, '$down', (next) => {
						for(let num = 1; num <= 9; num++) {
							if(!nums[num]) next.possible[num] = false;
						}
					});
				}
			}
		});
	}

	/* given that we've already paired down the possible values, only lists that have combinations of the related possible values */
	/* e.g. 7 [1, 2, 3, 4, 5] [4, 5, 6] ~ this should take out the 4, 5 from the first cell since there is no appropriate counterpart */
	// TODO heuristic_usePossible

	/* if two cells have can only have the same 2 numbers, then no other cell can use those two numbers */
	// TODO heuristic_pairs
	// XXX make this more general (or i guess, make a similar one for 3 and 4)

	/*
	 * if a cell has possible values, that takes up the whole, uh, slot for the list of given values, then no other cell can use it
	 * e.g. if a cell can only have numbers [1,2], and the possible values are [1,8,9] and [2,7,9], then other no other cell can use 1 or 2
	 */
	// TODO heuristic_slots

	function validateBoard(board) {
		forEachBoard(board, validateCell);
	}
	function validateCell(cell) {
		cell.errors['value-impossible'] = false;
		cell.errors['value-duplicate'] = false;
		if(cell.type === 'cell') {
			if(cell.value !== null) {
				// value-impossible
				// the value isn't one of the possible values
				cell.errors['value-impossible'] = !cell.possible[cell.value];

				// value-duplicate
				// the value is already used in a row or column
				let next = cell.$right;
				while(next && next.type === 'cell' && !cell.errors['value-duplicate']) {
					if(next.value === cell.value) cell.errors['value-duplicate'] = true;
					next = next.$right;
				}
				next = cell.$left;
				while(next && next.type === 'cell' && !cell.errors['value-duplicate']) {
					if(next.value === cell.value) cell.errors['value-duplicate'] = true;
					next = next.$left;
				}
				next = cell.$up;
				while(next && next.type === 'cell' && !cell.errors['value-duplicate']) {
					if(next.value === cell.value) cell.errors['value-duplicate'] = true;
					next = next.$up;
				}
				next = cell.$down;
				while(next && next.type === 'cell' && !cell.errors['value-duplicate']) {
					if(next.value === cell.value) cell.errors['value-duplicate'] = true;
					next = next.$down;
				}
			}
		}

		cell.errors['right-no-space'] = false;
		cell.errors['down-no-space'] = false;
		cell.errors['right-sum'] = false;
		cell.errors['down-sum'] = false;
		if(cell.type === 'empty') {
			// right-no-space
			// if a 'right' sum is specified, but there isn't room for it
			if(!!cell.right && cell.rightLength < 2) {
				cell.errors['right-no-space'] = true;
			}

			// down-no-space
			// if a 'down' sum is specified, but there isn't room for it
			if(!!cell.down && cell.downLength < 2) {
				cell.errors['down-no-space'] = true;
			}

			// right-sum
			// if a row is completed and the numbers don't add up to how it's labeled
			let rightSum = null;
			if(!!cell.right) {
				rightSum = 0;
				forEachCell(cell, '$right', function(next) {
					if(!!next.value) {
						rightSum += next.value;
					} else {
						rightSum = null;
						return false;
					}
				});
			}
			cell.errors['right-sum'] = (rightSum !== null && rightSum !== cell.right);

			// down-sum
			// if a col is completed and the numbers don't add up to how it's labeled
			let downSum = null;
			if(!!cell.down) {
				downSum = 0;
				forEachCell(cell, '$down', function(next) {
					if(!!next.value) {
						downSum += next.value;
					} else {
						downSum = null;
						return false;
					}
				});
			}
			cell.errors['down-sum'] = (downSum !== null && downSum !== cell.down);

			// TODO right-no-number
			// if there is an empty with no right sum, and to the right is a cell

			// TODO down-no-number
			// if there is an empty with no down sum, and to the down is a cell
		}
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

	function saveBoard(board) {
		return board.map(function(row) {
			return row.map(function(cell) {
				const ret = {
					type: cell.type,
				};
				switch(cell.type) {
					case 'none':
						// nothing to save
						break;
					case 'empty':
						if(!!cell.right) ret.right = cell.right;
						if(!!cell.down) ret.down = cell.down;
							break;
					case 'cell':
						if(!!cell.value) ret.value = cell.value;
						break;
				}
				return ret;
			});
		});
	};

	/* super simple sample board */
	// const TEMPLATE = JSON.parse('');
	const THREE_BY_THREE = JSON.parse('[[{"type":"empty"},{"type":"empty","down":12},{"type":"empty","down":3}],[{"type":"empty","right":11},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":4},{"type":"cell"},{"type":"cell"}]]');
	const NINE_SEVEN_EASY = JSON.parse('[[{"type":"empty"},{"type":"empty","down":14},{"type":"empty","down":4},{"type":"empty","down":19},{"type":"empty"},{"type":"empty","down":11},{"type":"empty","down":3}],[{"type":"empty","right":8},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":10},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":17},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":3,"down":19},{"type":"cell"},{"type":"cell"}],[{"type":"empty"},{"type":"empty","down":24},{"type":"empty","right":7,"down":30},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty"}],[{"type":"empty","right":30},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","down":26},{"type":"empty","down":17}],[{"type":"empty","right":16},{"type":"cell"},{"type":"cell"},{"type":"empty","right":21,"down":24},{"type":"cell"},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":24},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":17,"down":15},{"type":"cell"},{"type":"cell"}],[{"type":"empty"},{"type":"empty","right":30},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty"}],[{"type":"empty"},{"type":"empty"},{"type":"empty","right":23},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty"}]]');
	const FOURTEEN_SIXTEEN_MEDIUM = JSON.parse('[[{"type":"empty"},{"type":"empty","down":17},{"type":"empty","down":21},{"type":"empty","down":17},{"type":"empty","down":15},{"type":"empty","down":23},{"type":"empty","down":3},{"type":"empty"},{"type":"empty","down":8},{"type":"empty","down":23},{"type":"empty","down":7},{"type":"empty"},{"type":"empty","down":21},{"type":"empty","down":30}],[{"type":"empty","right":23},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":8},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":7,"down":17},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":33},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":39,"down":8},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"}],[{"type":"empty"},{"type":"empty","right":10,"down":6},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":7,"down":19},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":24,"down":34},{"type":"cell"},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":6},{"type":"cell"},{"type":"cell"},{"type":"empty","right":22,"down":9},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":4,"down":26},{"type":"cell"},{"type":"cell"},{"type":"empty","right":17},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":12},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":17,"down":24},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","down":10},{"type":"empty","down":22},{"type":"empty","down":23}],[{"type":"empty","right":11},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":16,"down":34},{"type":"cell"},{"type":"cell"},{"type":"empty","right":34,"down":20},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"}],[{"type":"empty"},{"type":"empty","down":24},{"type":"empty","right":22,"down":19},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":16,"down":29},{"type":"cell"},{"type":"cell"},{"type":"empty","right":30,"down":6},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":16},{"type":"cell"},{"type":"cell"},{"type":"empty","right":41,"down":16},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":17,"down":6},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":30},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":17,"down":23},{"type":"cell"},{"type":"cell"},{"type":"empty","right":6,"down":9},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","down":21},{"type":"empty","down":6}],[{"type":"empty","right":39},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":4,"down":6},{"type":"cell"},{"type":"cell"},{"type":"empty","right":10,"down":31},{"type":"cell"},{"type":"cell"},{"type":"cell"}],[{"type":"empty"},{"type":"empty","down":23},{"type":"empty","down":14},{"type":"empty","right":23},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":15,"down":26},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":3},{"type":"cell"},{"type":"cell"},{"type":"empty","right":3,"down":8},{"type":"cell"},{"type":"cell"},{"type":"empty","right":21,"down":8},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":4,"down":20},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":24},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":6,"down":5},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":30,"down":15},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","down":14}],[{"type":"empty","right":21},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":39},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":11},{"type":"cell"},{"type":"cell"},{"type":"empty","right":6},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":22},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"}]]');
})();