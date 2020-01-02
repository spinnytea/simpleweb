(function() {
	'use strict';
	const MIN_ROW = 1+2;
	const MAX_ROW = 1+2+3+4+5+6+7+8+9;

	// TEST high level integration test that solves a very simple board
	//  - just to make sure that the game works
	// TODO about dialog
	//  - make a little description of what kakuro is for new players
	//  - maybe link to wikipedia?
	const module = angular.module('kakuro', []);
	module.controller('kakuro.body.controller', [
		'$timeout',
		function SimpleWebBodyController($timeout) {
			const body = this;
			body.showDemo = true; // XXX should showDemo always be on?
			body.PREDEFINED_BOARDS = PREDEFINED_BOARDS;
			body.formData = { height: 3, width: 3 };

			// demo config
			let focus;
			let board;
			body.showSetup = true;
			body.loadBoard = function(def) {
				board = body.board = loadBoard(def);
				body.showSetup = false;
				initGame();
			};
			body.makeBoard = function() {
				board = body.board = makeBoard(body.formData.height, body.formData.width);
				body.showSetup = true;
				initGame();
			};
			body.makeBoard();

			function initGame() {
				focus = body.focus = {
					x: 0,
					y: 0,
					cell: board[0][0],
				};
				recomputeMetadata(board);
				validateBoard(board);
				heuristic(board);
			}

			body.handleKeys = function handleKeys($event) {
				if($('input').is(':focus')) {
					// defer to input
					return;
				}

				switch($event.key) {
					case 'ArrowDown': stop($event); moveFocusDown(); break;
					case 'ArrowRight': stop($event); moveFocusRight(); break;
					case 'ArrowUp': stop($event); moveFocusUp(); break;
					case 'ArrowLeft': stop($event); moveFocusLeft(); break;
					case 'r': stop($event); heuristic(board); break;
					case 'e':
						stop($event);
						setEmpty(focus.cell);
						recomputeMetadata(board);
						if(!!board.$stats.noneCount) moveFocusDown();
						validateBoard(board);
						break;
					case 'c':
						stop($event);
						setCell(focus.cell);
						recomputeMetadata(board);
						if(!!board.$stats.noneCount) moveFocusDown();
						else heuristic(board);
						validateBoard(board);
						checkFinished(board);
						break;
					case '1': case '2': case '3':
					case '4': case '5': case '6':
					case '7': case '8': case '9':
						stop($event);
						setCellValue(focus.cell, +$event.key);
						heuristic(board);
						validateBoard(board);
						checkFinished(board);
						break;
					// default: console.log($event.key); break;
				}
			};
			function stop(e) {
				e.stopPropagation();
				e.preventDefault();
			}
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

			body.saveFeedback = false;
			body.save = function() {
				body.saveStr = JSON.stringify(saveBoard(board));
				$timeout(function() {
					/* Get the text field */
					const copyText = document.getElementById("copyText");

					/* Select the text field */
					copyText.select();
					copyText.setSelectionRange(0, 99999); /*For mobile devices*/

					/* Copy the text inside the text field */
					document.execCommand("copy");

					body.saveFeedback = true;
					$timeout(function() {
						body.saveFeedback = false;
					}, 500);
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
			 * REVIEW refactor possible booleans
			 *  - each heuristic sets this to "false", if we do circular logic or change input, then we need to start from scratch
			 *  - if one heuristic changes it back to "true", we need to run all the others again to see if any of them are false
			 *  - this was originally designed to only ever take the value to false
			 *  ---
			 *  - maybe this always has to happen
			 *  - the only variability after we start is changing the value of a cell
			 *  - if it goes from null -> number, then it's fine
			 *  - but if it goes from number -> number or number -> null, then we have to redo all the heuristics anyway
			 * TODO user input to turn off booleans
			 *  - there are heuristics that need to be implemented
			 *  - which means there is other logic for disabling numbers that we need to play with
			 *  ---
			 *  - *it will let us play with it* (it makes the game more playable)
			 *  - there should always be user input so we can play with it
			 *  - maybe in the future there may be a toggle to not do heuristics at all ?
			 *  - maybe in the future there will be an auto-solver, and if it gets stuck you can turn off numbers to help it along
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
	/** loop over the whole board, callback(cell) for every cell on the board */
	function forEachBoard(board, callback) {
		board.forEach(function(row) {
			row.forEach(function(cell) {
				callback(cell);
			});
		});
	}
	/**
	 * given a cell (usually an empty), step in the direct, and call every cell in the path, until the end
	 * this is primarily used to loop over every cell in a given right/down row/col
	 */
	function marchAlongCell(cell, dir, callback) {
		let next = cell[dir];
		while(next && next.type === 'cell') {
			if(callback(next) === false) return;
			next = next[dir];
		}
	}
	/** most of the heuristics start with the empty cells; instead of looping over every cell every time, just loop over these */
	function forEachEmpty(board, callback) {
		board.$empty.forEach(function(cell) {
			callback(cell);
		});
	}

	/**
	 * during setup, mark a cell as empty
	 *
	 * REVIEW think of a better way to get the input than a prompt
	 */
	function setEmpty(cell) {
		cell.type = 'empty';

		let val = +prompt('Sum across the row to the right.', cell.right || '');
		if(!isNaN(val) && +val === Math.floor(val) && MIN_ROW <= val && val <= MAX_ROW) {
			cell.right = +val;
		} else {
			cell.right = null;
		}

		val = +prompt('Sum down the col below.', cell.down || '');
		if(!isNaN(val) && +val === Math.floor(val) && MIN_ROW <= val && val <= MAX_ROW) {
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

	/**
	 * this is for initializing all the metadata about a board
	 * since we can load a board, make a board from scratch, or live edit a board (there are multiple ways to source a board)
	 * we need to call this every time the board changes
	 *
	 * changes: not the solving of the board, but the board configuration
	 * changes: cell type, empty right/down
	 */
	function recomputeMetadata(board) {
		board.$stats = {
			noneCount: 0,
			isFinished: false,
		};
		board.$empty = [];

		forEachBoard(board, function(cell) {
			if(cell.type === 'none') board.$stats.noneCount++;
			if(cell.type === 'empty') {
				board.$empty.push(cell);

				cell.rightLength = 0;
				if(!!cell.right) {
					marchAlongCell(cell, '$right', (next) => {
						cell.rightLength++;
						next.$rightHead = cell;
					});
				}

				cell.downLength = 0;
				if(!!cell.down) {
					marchAlongCell(cell, '$down', (next) => {
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

	// XXX early termination
	function checkFinished(board) {
		let finished = true;
		forEachBoard(board, function(cell) {
			// nothing can have a validation error
			if(Object.values(cell.errors).some((e) => !!e)) {
				finished = false;
			}
			// all numbers must be filled in
			if(cell.type === 'cell' && cell.value === null) {
				finished = false;
			}
		});
		board.$stats.isFinished = finished;
	}

	function possibleValues(cell, dir) {
		if(!cell || cell.type !== 'empty' && !!cell[dir] && !!cell[dir+'Length']) return [];

		// the list of numbers that have already been entered
		const nums = [];
		marchAlongCell(cell, '$'+dir, (next) => {
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

	// IDEA doing heuristics on the whole board is using the hammer
	//  - we can make it faster/smarter if we do heuristics per cell
	//  - the trick is, how do we decide when to do each one?
	//  - (reset / lengthAndSum are special, and should just be done globally up front)
	function heuristic(board) {
		forEachBoard(board, heuristic_reset);
		forEachEmpty(board, heuristic_value);
		forEachEmpty(board, heuristic_lengthAndSum);
	}

	/* reset the possible values back to true */
	function heuristic_reset(cell) {
		if(cell.type === 'cell') {
			for(let n = 1; n <= 9; n++)
				cell.possible[n] = true;
		}
	}

	/* update cell.possible based on numbers that have alrady been entered */
	function heuristic_value(cell) {
		if(cell.type === 'empty') {
			if(!!cell.right) {
				// collect the numbers
				let nums = {};
				marchAlongCell(cell, '$right', (next) => {
					if(!!next.value) nums[next.value] = true;
				});
				nums = Object.keys(nums).map((num) => +num);

				// disallow the values
				marchAlongCell(cell, '$right', (next) => {
					nums.forEach(function(num) {
						if(next.value !== num) next.possible[num] = false;
					});
				});
			}

			if(!!cell.down) {
				// collect the numbers
				let nums = {};
				marchAlongCell(cell, '$down', (next) => {
					if(!!next.value) nums[next.value] = true;
				});
				nums = Object.keys(nums).map((num) => +num);

				// disallow the values
				marchAlongCell(cell, '$down', (next) => {
					nums.forEach(function(num) {
						if(next.value !== num) next.possible[num] = false;
					});
				});
			}
		}
	}

	/* update cell.possible based on the numbers that are possible for the length/sum of a row/col */
	/* basically, given a length and sum, what are all the possible numbers we could use */
	function heuristic_lengthAndSum(cell) {
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
				marchAlongCell(cell, '$right', (next) => {
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
				marchAlongCell(cell, '$down', (next) => {
					for(let num = 1; num <= 9; num++) {
						if(!nums[num]) next.possible[num] = false;
					}
				});
			}
		}
	}

	/* given that we've already paired down the possible values, only lists that have combinations of the related possible values */
	function heuristic_usePossible(cell) {

	}

	/* if two cells have can only have the same 2 numbers, then no other cell can use those two numbers */
	// TODO heuristic_pairs
	// XXX make this more general (or i guess, make a similar one for 3 and 4)

	/*
	 * if a cell has possible values, that takes up the whole, uh, slot for the list of given values, then no other cell can use it
	 * e.g. if a cell can only have numbers [1,2], and the possible values are [1,8,9] and [2,7,9], then other no other cell can use 1 or 2
	 */
	// TODO heuristic_slots

	// IDEA there is a more general heuristic for pairs/slots, but i just can formulate it, it may be too complex
	//  - given any set of cells in a row, if they all use up the same number of slots as the group (no more no less)
	//    AND the numbers of this slot are not in any other cell
	//    THEN those cells must only use the numbers in those slots, and the other cells cannot use the numbers in those slots
	//  - that's not exactly right, there's a hole somewhere
	//  - I probably need examples and unit tests

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
				if(!cell.possible[cell.value]) {
					cell.errors['value-impossible'] = 'The specified value is not one of the possible values.';
				}

				// value-duplicate
				// the value is already used in a row or column
				let next = cell.$right;
				while(next && next.type === 'cell' && !cell.errors['value-duplicate']) {
					if(next.value === cell.value) cell.errors['value-duplicate'] = 'The specified value is used more than once in it\'s row/col.';
					next = next.$right;
				}
				next = cell.$left;
				while(next && next.type === 'cell' && !cell.errors['value-duplicate']) {
					if(next.value === cell.value) cell.errors['value-duplicate'] = 'The specified value is used more than once in it\'s row/col.';
					next = next.$left;
				}
				next = cell.$up;
				while(next && next.type === 'cell' && !cell.errors['value-duplicate']) {
					if(next.value === cell.value) cell.errors['value-duplicate'] = 'The specified value is used more than once in it\'s row/col.';
					next = next.$up;
				}
				next = cell.$down;
				while(next && next.type === 'cell' && !cell.errors['value-duplicate']) {
					if(next.value === cell.value) cell.errors['value-duplicate'] = 'The specified value is used more than once in it\'s row/col.';
					next = next.$down;
				}
			}
		}

		cell.errors['right-no-space'] = false;
		cell.errors['down-no-space'] = false;
		cell.errors['right-sum'] = false;
		cell.errors['down-sum'] = false;
		cell.errors['right-number-missing'] = false;
		cell.errors['down-number-missing'] = false;
		if(cell.type === 'empty') {
			// right-no-space
			// if a 'right' sum is specified, but there isn't room for it
			if(!!cell.right && cell.rightLength < 2) {
				cell.errors['right-no-space'] = 'There isn\'t enough room for a row.';
			}

			// down-no-space
			// if a 'down' sum is specified, but there isn't room for it
			if(!!cell.down && cell.downLength < 2) {
				cell.errors['down-no-space'] = 'There isn\'t enough room for a col.';
			}

			// right-sum
			// if a row is completed and the numbers don't add up to how it's labeled
			let rightSum = null;
			if(!!cell.right && !!cell.rightLength) {
				rightSum = 0;
				marchAlongCell(cell, '$right', function(next) {
					if(!!next.value) {
						rightSum += next.value;
					} else {
						rightSum = null;
						return false;
					}
				});
			}
			if(rightSum !== null && rightSum !== cell.right) {
				cell.errors['right-sum'] = 'The row is completed and the values don\'t match the advertised sum.';
			}

			// down-sum
			// if a col is completed and the numbers don't add up to how it's labeled
			let downSum = null;
			if(!!cell.down && !!cell.downLength) {
				downSum = 0;
				marchAlongCell(cell, '$down', function(next) {
					if(!!next.value) {
						downSum += next.value;
					} else {
						downSum = null;
						return false;
					}
				});
			}
			if(downSum !== null && downSum !== cell.down) {
				cell.errors['down-sum'] = 'The col is completed and the values don\'t match the advertised sum.';
			}

			// right-number-missing
			// if there is an empty with no right sum, and to the right is a cell
			if(!cell.right) {
				if(cell.$right && cell.$right.type === 'cell') {
					cell.errors['right-number-missing'] = 'The row needs a sum since it is not empty.';
					cell.right = 0;
				} else {
					cell.right = null;
				}
			}

			// down-number-missing
			// if there is an empty with no down sum, and to the down is a cell
			if(!cell.down) {
				if(cell.$down && cell.$down.type === 'cell') {
					cell.errors['down-number-missing'] = 'The col needs a sum since it is not empty.';
					cell.down = 0;
				} else {
					cell.down = null;
				}
			}
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
	const PREDEFINED_BOARDS = {
		// 'Template': JSON.parse(''),
		'3x3': JSON.parse('[[{"type":"empty"},{"type":"empty","down":12},{"type":"empty","down":3}],[{"type":"empty","right":11},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":4},{"type":"cell"},{"type":"cell"}]]'),
		'9x7 Easy': JSON.parse('[[{"type":"empty"},{"type":"empty","down":14},{"type":"empty","down":4},{"type":"empty","down":19},{"type":"empty"},{"type":"empty","down":11},{"type":"empty","down":3}],[{"type":"empty","right":8},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":10},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":17},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":3,"down":19},{"type":"cell"},{"type":"cell"}],[{"type":"empty"},{"type":"empty","down":24},{"type":"empty","right":7,"down":30},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty"}],[{"type":"empty","right":30},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","down":26},{"type":"empty","down":17}],[{"type":"empty","right":16},{"type":"cell"},{"type":"cell"},{"type":"empty","right":21,"down":24},{"type":"cell"},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":24},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":17,"down":15},{"type":"cell"},{"type":"cell"}],[{"type":"empty"},{"type":"empty","right":30},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty"}],[{"type":"empty"},{"type":"empty"},{"type":"empty","right":23},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty"}]]'),
		'10x8 Medium': JSON.parse('[[{"type":"empty"},{"type":"empty"},{"type":"empty"},{"type":"empty","down":12},{"type":"empty","down":9},{"type":"empty","down":16},{"type":"empty","down":23},{"type":"empty"}],[{"type":"empty"},{"type":"empty"},{"type":"empty","right":26,"down":21},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty"}],[{"type":"empty"},{"type":"empty","right":19,"down":3},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","down":3}],[{"type":"empty","right":18},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","down":6},{"type":"empty","right":7,"down":3},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":11},{"type":"cell"},{"type":"cell"},{"type":"empty","right":10,"down":4},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"}],[{"type":"empty"},{"type":"empty","down":4},{"type":"empty","right":6,"down":14},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","down":16},{"type":"empty","down":10}],[{"type":"empty","right":12},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":5,"down":9},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":3},{"type":"cell"},{"type":"cell"},{"type":"empty","down":14},{"type":"empty","right":18,"down":12},{"type":"cell"},{"type":"cell"},{"type":"cell"}],[{"type":"empty"},{"type":"empty","right":16},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty"}],[{"type":"empty"},{"type":"empty","right":28},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty"},{"type":"empty"}]]'),
		'16x14 Medium': JSON.parse('[[{"type":"empty"},{"type":"empty","down":17},{"type":"empty","down":21},{"type":"empty","down":17},{"type":"empty","down":15},{"type":"empty","down":23},{"type":"empty","down":3},{"type":"empty"},{"type":"empty","down":8},{"type":"empty","down":23},{"type":"empty","down":7},{"type":"empty"},{"type":"empty","down":21},{"type":"empty","down":30}],[{"type":"empty","right":23},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":8},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":7,"down":17},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":33},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":39,"down":8},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"}],[{"type":"empty"},{"type":"empty","right":10,"down":6},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":7,"down":19},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":24,"down":34},{"type":"cell"},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":6},{"type":"cell"},{"type":"cell"},{"type":"empty","right":22,"down":9},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":4,"down":26},{"type":"cell"},{"type":"cell"},{"type":"empty","right":17},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":12},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":17,"down":24},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","down":10},{"type":"empty","down":22},{"type":"empty","down":23}],[{"type":"empty","right":11},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":16,"down":34},{"type":"cell"},{"type":"cell"},{"type":"empty","right":34,"down":20},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"}],[{"type":"empty"},{"type":"empty","down":24},{"type":"empty","right":22,"down":19},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":16,"down":29},{"type":"cell"},{"type":"cell"},{"type":"empty","right":30,"down":6},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":16},{"type":"cell"},{"type":"cell"},{"type":"empty","right":41,"down":16},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":17,"down":6},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":30},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":17,"down":23},{"type":"cell"},{"type":"cell"},{"type":"empty","right":6,"down":9},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","down":21},{"type":"empty","down":6}],[{"type":"empty","right":39},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":4,"down":6},{"type":"cell"},{"type":"cell"},{"type":"empty","right":10,"down":31},{"type":"cell"},{"type":"cell"},{"type":"cell"}],[{"type":"empty"},{"type":"empty","down":23},{"type":"empty","down":14},{"type":"empty","right":23},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":15,"down":26},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":3},{"type":"cell"},{"type":"cell"},{"type":"empty","right":3,"down":8},{"type":"cell"},{"type":"cell"},{"type":"empty","right":21,"down":8},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":4,"down":20},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":24},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":6,"down":5},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":30,"down":15},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","down":14}],[{"type":"empty","right":21},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":39},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"}],[{"type":"empty","right":11},{"type":"cell"},{"type":"cell"},{"type":"empty","right":6},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"empty","right":22},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"},{"type":"cell"}]]'),
	};

	// exports for unit testing
	if(typeof window === 'undefined') {
		exports.heuristic_reset = heuristic_reset;
		exports.heuristic_value = heuristic_value;
		exports.heuristic_lengthAndSum = heuristic_lengthAndSum;
		exports.heuristic_usePossible = heuristic_usePossible;
	}
})();