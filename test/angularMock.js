/**
 * The whole reason this file exists is so we don't need to load angular for tests
 * For these unit tests, we don't care about angular, we just want to test the js file
 */
'use strict';

global.angular = exports;

exports.module = () => {
	return {
		controller: () => {},
	};
};
