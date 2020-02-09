const expect = require('chai').expect;
const kakuro = require('../lib/kakuro/kakuro');

// load some globals by side effect
require('./angularMock');
require('../lib/kakuro/possible_values');


describe('kakuro', function() {
	/**
	 * create a single cell for testing
	 * possible should be a list of numbers that are set to true
	 * if possible is not provided, then ALL will be set to true
	 *
	 * NOTE this is a test double of what we expect to see on the board
	 */
	function createCell(possible) {
		const $cell = { type: 'cell', value: null, possible: new Set() };
		if(possible) possible.forEach((n) => $cell.possible.add(n));
		else for(let n = 1; n <= 9; n++) $cell.possible.add(n);
		return $cell;
	}

	/**
	 * create a row and col for testing
	 * possible should be a list of list of possible numbers (e.g. [[1, 2], [1, 2]])
	 * possible can be a number, in which case there will be that many cells and ALL numbers will be possible
	 *
	 * NOTE this is a test double of what we expect to see on the board
	 */
	function createRow(sum, possible) {
		const $head = { type: 'empty', right: sum, down: sum }
		let $right = $head;
		let $down = $head;
		if(typeof possible === 'object') {
			$head.rightLength = $head.downLength = possible.length;
			possible.forEach(function(nums) {
				$right = $right.$right = createCell(nums);
				$down = $down.$down = createCell(nums);
			});
		} else if(typeof possible === 'number') {
			$head.rightLength = $head.downLength = possible;
			for(let i = 0; i < possible; i++) {
				$right = $right.$right = createCell();
				$down = $down.$down = createCell();
			}
		}
		return $head;
	}

	function listPossibleRow($head, dir) {
		const list = [];
		while($head[dir]) {
			$head = $head[dir];
			list.push(listPossibleCell($head));
		}
		return list;
	}
	function listPossibleCell(cell) {
		const list = [];
		for (let num of cell.possible) {
			list.push(num);
		}
		return list;
	}

	it('ensure we have accounted for everything that is exported', function() {
		expect(Object.keys(kakuro)).to.deep.equal([
			'heuristic_reset',
			'heuristic_possibleUser',
			'heuristic_value',
			'heuristic_lengthAndSum',
			'heuristic_usePossible',
		]);
	});

	describe('heuristic', function() {
		it('reset', function() {
			const reset = kakuro.heuristic_reset;
			const $head = createRow(3, [[1, 2], [1, 2]]);

			expect(listPossibleCell($head.$right)).to.deep.equal([1, 2]);

			reset($head.$right);

			expect(listPossibleCell($head.$right)).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9]);
		});

		it('possibleUser');

		describe('value', function() {
			const value = kakuro.heuristic_value;

			it('simple', function() {
				const $head = createRow(3, [[1, 2], [1, 2]]);

				expect($head.$right.$right.possible.has(2)).to.equal(true);
				expect($head.$down.$down.possible.has(1)).to.equal(true);
				expect(listPossibleRow($head, '$right')).to.deep.equal([[1, 2], [1, 2]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[1, 2], [1, 2]]);

				$head.$right.value = 2;
				value($head);

				expect($head.$right.$right.possible.has(2)).to.equal(false);
				expect($head.$down.$down.possible.has(1)).to.equal(true);
				expect(listPossibleRow($head, '$right')).to.deep.equal([[1, 2], [1]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[1, 2], [1, 2]]);

				$head.$down.value = 1;
				value($head);

				expect($head.$right.$right.possible.has(2)).to.equal(false);
				expect($head.$down.$down.possible.has(1)).to.equal(false);
				expect(listPossibleRow($head, '$right')).to.deep.equal([[1, 2], [1]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[1, 2], [2]]);
			});
		}); // end value

		describe('lengthAndSum', function() {
			const lengthAndSum = kakuro.heuristic_lengthAndSum;

			it('one way low', function() {
				const $head = createRow(3, 2);
				// this row has a minimal set of numbers
				expect(global.POSSIBLE_VALUES[2][3]).to.deep.equal([
					[1, 2],
				]);

				expect(listPossibleRow($head, '$right')).to.deep.equal([[1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9]]);

				lengthAndSum($head);

				expect(listPossibleRow($head, '$right')).to.deep.equal([[1, 2], [1, 2]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[1, 2], [1, 2]]);
			});

			it('one way hight', function() {
				const $head = createRow(23, 3);
				// this row has a minimal set of numbers
				expect(global.POSSIBLE_VALUES[3][23]).to.deep.equal([
					[6, 8, 9],
				]);

				expect(listPossibleRow($head, '$right')).to.deep.equal([[1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9]]);

				lengthAndSum($head);

				expect(listPossibleRow($head, '$right')).to.deep.equal([[6, 8, 9], [6, 8, 9], [6, 8, 9]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[6, 8, 9], [6, 8, 9], [6, 8, 9]]);
			});

			it('two ways, simple', function() {
				const $head = createRow(6, 2);
				// this row as a simple but mixed set of numbers in it
				expect(global.POSSIBLE_VALUES[2][6]).to.deep.equal([
					[1, 5],
					[2, 4],
				]);

				expect(listPossibleRow($head, '$right')).to.deep.equal([[1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9]]);

				lengthAndSum($head);

				expect(listPossibleRow($head, '$right')).to.deep.equal([[1, 2, 4, 5], [1, 2, 4, 5]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[1, 2, 4, 5], [1, 2, 4, 5]]);
			});

			it('all values', function() {
				const $head = createRow(16, 3);
				// this row could have any number in it
				expect(global.POSSIBLE_VALUES[3][18]).to.deep.equal([
					[1, 8, 9],
					[2, 7, 9],
					[3, 6, 9],
					[3, 7, 8],
					[4, 5, 9],
					[4, 6, 8],
					[5, 6, 7],
				]);

				expect(listPossibleRow($head, '$right')).to.deep.equal([[1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9]]);

				lengthAndSum($head);

				// this doesn't actually change anything
				expect(listPossibleRow($head, '$right')).to.deep.equal([[1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9]]);
			});
		}); // end lengthAndSum

		describe('usePossible', function() {
			const usePossible = kakuro.heuristic_usePossible;

			/* e.g. 6 [2, 3] [1, 2] [1] ~ as simple as it can get */
			it('exhibit a, simple', function() {
				const $head = createRow(6, [[2, 3], [1, 2], [1]]);

				expect(listPossibleRow($head, '$right')).to.deep.equal([[2, 3], [1, 2], [1]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[2, 3], [1, 2], [1]]);

				usePossible($head);

				expect(listPossibleRow($head, '$right')).to.deep.equal([[3], [2], [1]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[3], [2], [1]]);
			});

			/* e.g. 7 [1, 2, 3, 4, 5] [4, 5, 6] ~ this should take out the 4, 5 from the first cell since there is no appropriate counterpart */
			it('exhibit b, prune first', function() {
				const $head = createRow(7, [[1, 2, 3, 4, 5], [4, 5, 6]]);

				expect(listPossibleRow($head, '$right')).to.deep.equal([[1, 2, 3, 4, 5], [4, 5, 6]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[1, 2, 3, 4, 5], [4, 5, 6]]);

				usePossible($head);

				expect(listPossibleRow($head, '$right')).to.deep.equal([[1, 2, 3], [4, 5, 6]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[1, 2, 3], [4, 5, 6]]);
			});

			/* e.g. 9 [7, 8] [2, 3, 5, 6, 7] ~ this should be 9 [7] [2] */
			it('exhibit c, prune second', function() {
				const $head = createRow(9, [[7, 8], [2, 3, 4, 5, 6, 7]]);

				expect(listPossibleRow($head, '$right')).to.deep.equal([[7, 8], [2, 3, 4, 5, 6, 7]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[7, 8], [2, 3, 4, 5, 6, 7]]);

				usePossible($head);

				expect(listPossibleRow($head, '$right')).to.deep.equal([[7], [2]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[7], [2]]);
			});

			/* e.g. 24 [8, 9] [7, 8, 9] [8, 9] ~ the middle one has to be 7 since 24 HAS to have 7 8 9 */
			it('exhibit d, prune middle', function() {
				const $head = createRow(24, [[8, 9], [7, 8, 9], [8, 9]]);

				expect(listPossibleRow($head, '$right')).to.deep.equal([[8, 9], [7, 8, 9], [8, 9]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[8, 9], [7, 8, 9], [8, 9]]);

				usePossible($head);

				expect(listPossibleRow($head, '$right')).to.deep.equal([[8, 9], [7], [8, 9]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[8, 9], [7], [8, 9]]);
			});
		}); // end usePossible
	}); // end heuristic
}); // end kakuro