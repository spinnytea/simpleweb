'use strict';

// TODO this doesn't change; save the result
//  - save the values in a static way
//  - comment out the code that computes them
//  ---
//  - but it IS computed rather fast...

// POSSIBLE_VALUES[length][sum] = [[numbers], [numbers]]
window.POSSIBLE_VALUES = {};

function calcPossibleValues(len, start, list) {
	const end = 10 - (len - list.length);
	for(let n = start+1; n <= 9; n++) {
		let next = list.slice(0); // copy the list so we can mutate it an not change the caller
		next.push(n);
		if(next.length === len) {
			addPossibleValues(next);
		} else {
			calcPossibleValues(len, n, next);
		}
	}
}

function addPossibleValues(list) {
	const length = list.length;
	const sum = list.reduce(function(s, v) { return s + v; }, 0);

	if(!POSSIBLE_VALUES[length]) {
		POSSIBLE_VALUES[length] = {};
	}
	if(!POSSIBLE_VALUES[length][sum]) {
		POSSIBLE_VALUES[length][sum] = [];
	}

	POSSIBLE_VALUES[length][sum].push(list);
}

calcPossibleValues(2, 0, []);
calcPossibleValues(3, 0, []);
calcPossibleValues(4, 0, []);
calcPossibleValues(5, 0, []);
calcPossibleValues(6, 0, []);
calcPossibleValues(7, 0, []);
calcPossibleValues(8, 0, []);
calcPossibleValues(9, 0, []);
