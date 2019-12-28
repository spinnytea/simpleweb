(function() {
	// TODO some kind of save/load system

	const module = angular.module('kakuro', []);
	module.controller('kakuro.body.controller', [
		function SimpleWebBodyController() {
			const body = this;

			const board = body.board = makeBoard(3, 3);
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
			function setEmpty(cell) {
				cell.type = 'empty';
				// modal to get left and right
				// TODO do something better than a modal
			}
			function setCell(cell) {
				cell.type = 'cell';
				cell.value = null;
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
		};
	}
})();