const expect = require('chai').expect;

const angular = require('./angularMock');
const kakuro = require('../lib/kakuro');

describe('kakuro', function() {
	/**
	 * create a single cell for testing
	 * NOTE this is a test double of what we expect to see on the board
	 */
	function createCell(possible) {
		const $cell = { type: 'cell', value: null, possible: {} };
		for(let n = 1; n <= 9; n++) $cell.possible[n] = false;
		possible.forEach((n) => $cell.possible[n] = true);
		return $cell;
	}

	/**
	 * create a row and col for testing
	 * NOTE this is a test double of what we expect to see on the board
	 */
	function createRow(sum, possible) {
		const $head = { type: 'empty', right: sum, down: sum }
		let $right = $head;
		let $down = $head;
		possible.forEach(function(nums) {
			// create another cell
			$right = $right.$right = createCell(nums);
			$down = $down.$down = createCell(nums);
		});
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
		for (let [key, value] of Object.entries(cell.possible)) {
			if(value) list.push(+key);
		}
		return list;
	}

	it('ensure we have accounted for everything that is exported', function() {
		expect(Object.keys(kakuro)).to.deep.equal([
			'heuristic_reset',
			'heuristic_value',
			'heuristic_lengthAndSum',
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

		describe('value', function() {
			const value = kakuro.heuristic_value;
			it('simple', function() {
				const $head = createRow(3, [[1, 2], [1, 2]]);

				expect($head.$right.$right.possible[2]).to.equal(true);
				expect($head.$down.$down.possible[2]).to.equal(true);
				expect(listPossibleRow($head, '$right')).to.deep.equal([[1, 2], [1, 2]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[1, 2], [1, 2]]);

				$head.$right.value = 2;
				value($head);

				expect($head.$right.$right.possible[2]).to.equal(false);
				expect($head.$down.$down.possible[2]).to.equal(true);
				expect(listPossibleRow($head, '$right')).to.deep.equal([[1, 2], [1]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[1, 2], [1, 2]]);

				$head.$down.value = 2;
				value($head);

				expect($head.$right.$right.possible[2]).to.equal(false);
				expect($head.$down.$down.possible[2]).to.equal(false);
				expect(listPossibleRow($head, '$right')).to.deep.equal([[1, 2], [1]]);
				expect(listPossibleRow($head, '$down')).to.deep.equal([[1, 2], [1]]);
			});
		}); // end value

		it('lengthAndSum');
	}); // end heuristic
}); // end kakuro