const expect = require('chai').expect;

const angular = require('./angularMock');
const kakuro = require('../lib/kakuro');

describe('kakuro', function() {
	it('ensure we have accounted for everything that is exported', function() {
		expect(Object.keys(kakuro)).to.deep.equal(['heuristic_reset']);
	});

	describe('heuristic', function() {
		it('reset');

		describe('value', function() {
			it('right');

			it('down');
		}); // end value
	}); // end heuristic
}); // end kakuro