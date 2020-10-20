(function() {
	'use strict';

	const center = {
		display: 'Web UI!',
		x: 50,
		y: 50,
		r: 25,
	};

	// TODO position via g[transform] ?
	// TODO move sizing to CSS (how do we get svgs to flow though...)
	const width = 200;
	const height = 100;
	const stackLeft = 0;
	const stackChildrenLeft = 30;

	const stackChildHeight = 4;
	const stackChildWidth = 15;
	const stackChildGap = 2;

	const database = window['structured-links-database'];
	const stacks = database.registry.filter((obj) => obj.type === 'stack-level');
	const stackHeight = height / (stacks.length + 1);
	stacks.forEach((s, sIdx) => {
		s.x = stackLeft;
		s.width = stackChildrenLeft - stackChildGap;
		s.y = (sIdx + 0.5) * stackHeight;
		s.height = stackHeight;

		s.children = database.stack[s.id] || [];
		s.children.forEach((c, cIdx) => {
			c.width = stackChildWidth - stackChildGap;
			c.height = stackChildHeight;

			// two tall
			c.x = stackChildGap + stackChildrenLeft + stackChildWidth * Math.floor(cIdx / 2);
			c.y = s.y + (s.height - stackChildHeight) * (cIdx % 2 === 0 ? 1 : 5) / 6;
		});


		const smallCircleR = 4;
		const rad = Math.asin(smallCircleR / center.r) * 2.5; // 0.5 for a gap
		s.circle = {
			x: center.x + Math.cos(rad * (sIdx + 0.5 - stacks.length / 2)) * center.r,
			y: center.y + Math.sin(rad * (sIdx + 0.5 - stacks.length / 2)) * center.r,
			r: smallCircleR,
		};
		// using a delta makes it easier to interpolate
		var dx = (s.x + 100) - s.circle.x; // HACK magic number 100 is just some style offsets
		var dy = (s.y + s.height / 2) - s.circle.y;
		s.path = [
			'M', s.circle.x, s.circle.y,
			'q', dx / 2, dy * 1.5, dx, dy
		].join(' ');
	});


	new Vue({
		el: '#root',
		data: {
			viewBox: `0 0 ${width} ${height}`,
			center,
			stackChildrenLeft,
			stacks,
		}
	});
})();