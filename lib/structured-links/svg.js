(function() {
	'use strict';

	// TODO position via g[transform] ?
	const width = 200;
	const height = 100;
	const stackLeft = 0;
	const stackChildrenLeft = 50;

	const stackChildHeight = 10;
	const stackChildWidth = 22;
	const stackChildGap = 2;

	const database = window['structured-links-database'];
	const stacks = database.registry.filter((obj) => obj.type === 'stack-level');
	const stackHeight = height / stacks.length;
	stacks.forEach((s, sIdx) => {
		s.x = stackLeft;
		s.width = stackChildrenLeft;
		s.y = sIdx * stackHeight;
		s.height = stackHeight;

		s.children = database.stack[s.id] || [];
		s.children.forEach((c, cIdx) => {
			c.x = stackChildGap + stackChildrenLeft + stackChildWidth * cIdx;
			c.width = stackChildWidth - stackChildGap;
			c.y = s.y + (s.height - stackChildHeight) / 2;
			c.height = stackChildHeight;
		});
	});


	new Vue({
		el: '#root',
		data: {
			viewBox: `0 0 ${width} ${height}`,
			stacks,
		}
	});
})();