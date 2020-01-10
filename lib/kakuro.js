(function() {
	'use strict';
	const ONE_THROUGH_NINE = [1, 2, 3, 4, 5, 6, 7, 8, 9];
	const MIN_ROW = 1+2;
	const MAX_ROW = ONE_THROUGH_NINE.reduce((s, n) => s + n, 0);
	const AUTOFILL_DELAY = 100;

	// TEST high level integration test that solves a very simple board
	//  - just to make sure that the game works
	// XXX about dialog; make a little description of what kakuro is for new players
	//  - maybe link to wikipedia?
	// XXX input via mobile/touch; i think i almost need a completely different ui
	// TODO generate board
	//  - https://puzzling.stackexchange.com/questions/49927/creating-a-kakuro-puzzle-with-unique-solution
	const module = angular.module('kakuro', []);
	module.controller('kakuro.body.controller', [
		'$timeout',
		function SimpleWebBodyController($timeout) {
			const body = this;
			body.showDemo = true; // REVIEW when should we turn the demo off?
			body.ONE_THROUGH_NINE = ONE_THROUGH_NINE;
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

			/** key events */
			body.handleKeys = function handleKeys($event) {
				if($('input').is(':focus')) {
					// defer to input
					return;
				}

				if(autofill.running) {
					stop($event);
					autofill.stop();
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
						if(!body.showSetup) break;
						setEmpty(focus.cell);
						recomputeMetadata(board);
						if(!!board.$stats.noneCount) moveFocusDown();
						validateBoard(board);
						break;
					case 'c':
						stop($event);
						if(!body.showSetup && focus.cell.type !== 'cell') break;
						setCell(focus.cell);
						recomputeMetadata(board);
						if(!!board.$stats.noneCount) moveFocusDown();
						else heuristic(board);
						validateBoard(board);
						checkFinished(board);
						break;
					case 'h':
						// IDEA maybe when we run complex heuristics, we just do it on the row/col that we are focused on
						//  - doing the basic heuristics on the whole board is fine
						//  - what i'm interested in is how to do the more complex ones in a smarter way
						//  - usePossible can be run multiple times in a row, we should try to localize it
						forEachEmpty(board, heuristic_usePossible);
						break;
					case 'n':
						autofill.start();
						break;
					case '1': case '2': case '3':
					case '4': case '5': case '6':
					case '7': case '8': case '9':
						stop($event);
						setCellValue(focus.cell, +$event.key);
						afterCellValue(board);
						break;
					case '!': case '@': case '#':
					case '$': case '%': case '^':
					case '&': case '*': case '(':
						stop($event);
						toggleCellPossibleUser(focus.cell, +({
							'!': 1, '@': 2, '#': 3,
							'$': 4, '%': 5, '^': 6,
							'&': 7, '*': 8, '(': 9,
						}[$event.key]));
						afterCellValue(board);
						break;
					case '`':
					case 'Backspace':
						stop($event);
						setCellValue(focus.cell, null);
						afterCellValue(board);
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

			/* mouse events */
			body.setFocus = function setFocus(cell) {
				focus.cell = cell;
				focus.y = board.findIndex((row) => {
					var index = row.indexOf(cell);
					if(index === -1) return false;
					focus.x = index;
					return true;
				});
			};
			body.clearFocusCellInput = function() {
				setCell(focus.cell);
				afterCellValue(board);
			};
			body.setFocusValue = function(value) {
				if(focus.cell.value === value) value = null; // toggle
				setCellValue(focus.cell, value);
				afterCellValue(board);
			};
			body.setFocusPossibleUser = function(value) {
				toggleCellPossibleUser(focus.cell, value);
				afterCellValue(board);
			};


			autofill.running = false;
			function autofill() {
				if(autofill.running) {
					// find the next cell with only one value
					let found = null;
					forEachBoard(board, function(cell) {
						if(cell.type === 'cell' && cell.possible.size === 1 && !cell.value) {
							found = cell;
							return false;

							// we could just set them all without an animation
							// but where's the fun in that
							// cell.value = cell.possible.values().next().value;
						}
					});
					if(found) {
						focus.cell = found; // move the focus cursor to this spot
						const num = found.possible.values().next().value; // get the single value from the set
						found.value = num; // set the value
						$timeout(autofill, AUTOFILL_DELAY); // since we found a value look for the next one
					} else {
						autofill.stop();
					}
				}
			}
			autofill.start = function() {
				if(!autofill.running) {
					autofill.running = true;
					autofill();
				}
			};
			autofill.stop = function() {
				autofill.running = false;
				focus.cell = board[focus.y][focus.x]; // reset the focus cursor
				afterCellValue(board); // redo the stuff since numbers (probably) changed
			};

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

	module.directive('emptyPossibleValues', [
		function EmptyPossibleValuesDirective() {
			return {
				restrict: 'A',
				scope: {
					cell: '=',
					dir: '@',
				},
				link: EmptyPossibleValuesLink,
				template: `
					<p>
						Sum: <span class="badge badge-primary" ng-bind="sum"></span>,
						Len: <span class="badge badge-primary" ng-bind="len"></span>
					</p>
					<ul>
						<li ng-repeat="list in pv">
							<span ng-repeat="num in list"
								class="num" ng-class="{ 'possible': isPossible(num) }"
								ng-bind="num"></span>
						</li>
					</ul>
				`,
			};
			function EmptyPossibleValuesLink($scope) {
				$scope.$watch('cell', function(cell) {
					const head = (cell.type === 'empty' ? cell : cell['$' + $scope.dir + 'Head']);
					$scope.sum = head[$scope.dir];
					$scope.len = head[$scope.dir + 'Length'];

					$scope.pv = possibleValues(head, $scope.dir);
				});

				$scope.isPossible = function(num) {
					return $scope.cell.type === 'cell' && $scope.cell.possible.has(num);
				};
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
			rightLength: null,
			downLength: null,

			/**
			 * for 'cell'
			 * value: the value of cell, then one we actually picked
			 * possible: which values are possible, we widdle them down with logic
			 * userPossible: same as possible, but user input; the user can turn off numbers they don't want to see
			 * $rightHead: the cell that labels this row
			 * $downHead: the cell that labels this col
			 */
			value: null,
			possible: new Set(ONE_THROUGH_NINE),
			possibleUser: new Set(ONE_THROUGH_NINE),
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
		for(let row of board) {
			for(let cell of row) {
				if(callback(cell) === false) return;
			}
		}
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
	function forEachPossibleNumber(cell, callback) {
		for(let num of cell.possible) {
			if(callback(num) === false) {
				return;
			}
		}
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
	 * clear user possible values
	 */
	function setCell(cell) {
		cell.type = 'cell';
		cell.value = null;
		ONE_THROUGH_NINE.forEach(function(num) {
			cell.possibleUser.add(num);
		});
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
	 * toggle user specified possible value for a cell
	 */
	function toggleCellPossibleUser(cell, value) {
		if(cell.type === 'cell') {
			if(cell.possibleUser.has(value)) {
				cell.possibleUser.delete(value);
			} else {
				cell.possibleUser.add(value);
			}
		}
	}
	/**
	 * the checks we need to recompute after a cell value changes
	 */
	function afterCellValue(board) {
		heuristic(board);
		validateBoard(board);
		checkFinished(board);
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
			return finished;
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

	function heuristic(board) {
		forEachBoard(board, heuristic_reset);
		forEachBoard(board, heuristic_possibleUser);
		forEachEmpty(board, heuristic_value);
		forEachEmpty(board, heuristic_lengthAndSum);

		// we don't want to do this here
		// use possible is cheats
		// doing this repeatly will result in the board being complete solved
		// forEachEmpty(board, heuristic_usePossible);
	}

	/* reset the possible values back to true */
	function heuristic_reset(cell) {
		if(cell.type === 'cell') {
			ONE_THROUGH_NINE.forEach((num) => {
				cell.possible.add(num);
			});
		}
	}

	/* use the user input to turn off some numbers */
	function heuristic_possibleUser(cell) {
		if(cell.type === 'cell') {
			ONE_THROUGH_NINE.forEach((num) => {
				if(!cell.possibleUser.has(num)) {
					cell.possible.delete(num);
				}
			});
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
						if(next.value !== num) next.possible.delete(num);
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
						if(next.value !== num) next.possible.delete(num);
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
				const nums = new Set(ONE_THROUGH_NINE);
				lists.forEach((list) => {
					list.forEach((num) => {
						nums.delete(num);
					});
				});

				// mark numbers as impossible
				marchAlongCell(cell, '$right', (next) => {
					nums.forEach((num) => {
						next.possible.delete(num);
					});
				});
			}

			if(!!cell.down) {
				const lists = possibleValues(cell, 'down');

				// collect all the possible numbers
				const nums = new Set(ONE_THROUGH_NINE);
				lists.forEach((list) => {
					list.forEach((num) => {
						nums.delete(num);
					});
				});

				// mark numbers as impossible
				marchAlongCell(cell, '$down', (next) => {
					nums.forEach((num) => {
						next.possible.delete(num);
					});
				});
			}
		}
	}

	/**
	 * given that we've already paired down the possible values, only lists that have combinations of the related possible values
	 * you can run this repeatedly
	 */
	function heuristic_usePossible(empty) {
		if(empty.type === 'empty') {
			doCheck('right');
			doCheck('down');
			function doCheck(dir) {
				const lists = possibleValues(empty, dir);

				// for each cell, check each value to see if it's valid
				// so for each cell, for each number in that cell
				marchAlongCell(empty, '$'+dir, (cell) => {
					forEachPossibleNumber(cell, function(num) {
						// at the very least, we can start with a smaller list
						// (we only need to check lists that contian the current number we are looking for)
						const ll = lists.filter(function(list) {
							return list.some((n) => n === num);
						});

						// if this number in this current cell isn't possible, then set it to false
						if(!checkIfUsePossibleNumber(empty, '$'+dir, cell, num, ll)) {
							cell.possible.delete(num);
						}
					});
				});
			}
		}
	}

	// NOTE there is still another heuristic to find
	//  - sure, there are probably optimizations to the usePossible one
	//  - like a particial solution for a more specific situation
	//  - but that last hard one (16x14) it something else
	//  - at some point, you need to guess and test, fill in a number and keep running usePossible until the board clears
	//  - but maybe there's something else we are missing?
	//  - right now I think `usePossible` is the ultimate solution, and that guess and test is unavoidable
	//  - but right now, i'm in the weeds of polishing the game and basking in the glory of having finished `usePossible`
	//  - (i had a typo in the smaller hard one and thought i wasn't finished, typo corrected and now i'm blind)
	//  - maybe there is something else to be done, maybe there isn't
	//  - maybe guess and test is the best we can do, maybe i'll find another heuristic later
	//  - but just solving with this tool makes you soft and blind
	//  ---
	//  - revisit this after you can play manually (that manual disable numbers)

	/**
	 * collect every possible set of numbers given that this one number is fixed
	 *
	 * @param {*} empty the head of the row/col we are checking
	 * @param {*} cell the cell we are checking
	 * @param {*} num the number we are checking
	 * @param {*} lists the only sets of numbers we care about
	 */
	function checkIfUsePossibleNumber(empty, dir, cell, num, lists) {
		// start!
		return marchNext(empty[dir], [num]);

		// recursive loop
		function marchNext(next, thisList) {
			if(next === cell) {
				// if we marched to the cell we are looking for, then we are only checking this specific number
				// which we already added at the beginning
				// so just keep going
				return marchNext(next[dir], thisList);
			} else if(next && next.type === 'cell') {
				// if we are still in the row
				// then we need to add another number to the list
				// that means we need to check every single number
				// if any one of them these recursions is possible, then the overall number is possible
				let possible = false;
				forEachPossibleNumber(next, function(n) {
					// make a copy of the current list with our number in it
					if(thisList.indexOf(n) === -1) {
						if(marchNext(next[dir], thisList.concat(n))) {
							possible = true;
						}
					}
					return !possible;  // exit early
				});
				return possible;
			} else {
				// we got to the end of the row
				// check to see if this list is one of the allowable lists
				thisList.sort();
				return lists.some(function(l) {
					for(let i = 0; i < l.length; i++) {
						if(l[i] !== thisList[i]) return false;
					}
					return true;
				});
			}
		}
	}

	/*
	 * xTODOx heuristic_slots
	 * if a cell has possible values, that takes up the whole, uh, slot for the list of given values, then no other cell can use it
	 * e.g. if a cell can only have numbers [1,2], and the possible values are [1,8,9] and [2,7,9], then other no other cell can use 1 or 2
	 * ---
	 * this isn't actually necessary
	 * usePossible will cover this
	 * - if a cell only fits in one slot, then any combination that tries to use a number in that slot will fail
	 * - so any number in that slot will fail in another cell
	 */

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
				if(!cell.possible.has(cell.value)) {
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

	// exports for unit testing
	if(typeof window === 'undefined') {
		exports.heuristic_reset = heuristic_reset;
		exports.heuristic_possibleUser = heuristic_possibleUser;
		exports.heuristic_value = heuristic_value;
		exports.heuristic_lengthAndSum = heuristic_lengthAndSum;
		exports.heuristic_usePossible = heuristic_usePossible;
	}
})();