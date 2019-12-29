(function() {
	const MIN_ROW = 1+2;
	const MAX_ROW = 1+2+3+4+5+6+7+8+9;

	const module = angular.module('kakuro', []);
	module.controller('kakuro.body.controller', [
		function SimpleWebBodyController() {
			const body = this;
			// TODO count the 'none' squares

			// TODO some kind of save/load system
			const board = body.board = makeBoard(3, 3);
			board[1][0].type = 'empty';
			board[1][0].right = 11;
			board[2][0].type = 'empty';
			board[2][0].right = 4;
			board[0][1].type = 'empty';
			board[0][1].down = 12;
			board[0][2].type = 'empty';
			board[0][2].down = 3;

			board[1][1].type = 'cell';
			board[1][1].value = 9;
			board[1][2].type = 'cell';
			board[1][2].value = 2;
			board[1][2].possible[2] = false;
			board[2][1].type = 'cell';
			board[2][1].value = 3;
			board[2][2].type = 'cell';
			board[2][2].possible[2] = false;
			board[2][2].possible[3] = false;
			// board[2][2].value = 1;

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
					case 'e': setEmpty(focus.cell); break;
					case 'c': setCell(focus.cell); break;
					case '1': case '2': case '3':
					case '4': case '5': case '6':
					case '7': case '8': case '9':
						setCellValue(focus.cell, +$event.key);
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
	function makeBoard(width, height) {
		const board = [];
		while(board.length < height) {
			const row = [];
			while(row.length < width) {
				const cell = makeCell();
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
			validateCell(cell);
		}
	}

	function validateCell(cell) {
		// value-impossible
		// the value isn't one of the possible values
		cell.errors['value-impossible'] = (cell.value !== null && !cell.possible[cell.value]);

		// TODO value-duplicate
		// the value is already used in a row or column
	}
})();