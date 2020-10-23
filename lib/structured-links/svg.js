(function() {
	'use strict';

	const width = 200;
	const height = 100;
	const database = window['structured-links-database'];
	const stacks = database.registry.filter((obj) => obj.type === 'stack-level');

	const center = {
		display: 'Web UI!',
		x: width / 4,
		y: height / 2,
		r: 25,
	};

	// REVIEW positioning, can we use more CSS?
	const stackLeft = 100;
	const stackGap = 1;
	const stackHeight = 10;
	// vertical center
	const stackTop = (height - (stacks.length * (stackHeight + stackGap) - stackGap)) / 2;

	const stackChildrenLeft = 30;
	const stackChildHeight = 3;
	const stackChildWidth = 15;
	const stackChildGap = 2;

	stacks.forEach((s, sIdx) => {
		s.x = stackLeft;
		s.width = stackChildrenLeft - stackChildGap;
		s.y = stackTop + sIdx * (stackHeight + stackGap);
		s.height = stackHeight - stackGap;

		s.container = {
			x: stackLeft + stackChildrenLeft,
			width: width - stackLeft - stackChildrenLeft - stackChildGap,
		};

		s.children = database.stack[s.id] || [];
		s.children.forEach((c, cIdx) => {
			c.width = stackChildWidth - stackChildGap;
			c.height = stackChildHeight;

			// two tall
			c.x = s.container.x + stackChildGap + stackChildWidth * Math.floor(cIdx / 2);
			c.y = s.y + (s.height - stackChildHeight) * (cIdx % 2 === 0 ? 1 : 5) / 6;
		});


		const smallCircleR = 2;
		const rad = Math.asin(smallCircleR / center.r) * 2.5; // 0.5 for a gap
		s.circle = {
			id: s.id + '--circle',
			x: center.x + Math.cos(rad * (sIdx + 0.5 - stacks.length / 2)) * center.r,
			y: center.y + Math.sin(rad * (sIdx + 0.5 - stacks.length / 2)) * center.r,
			r: smallCircleR,
		};
		// using a delta makes it easier to interpolate
		var dx = (s.x) - s.circle.x;
		var dy = (s.y + s.height / 2) - s.circle.y;
		s.path = [
			'M', s.circle.x, s.circle.y,
			'q', dx / 2, dy * 1.1, dx, dy
		].join(' ');


		// HACK adding this new object to the database/hover directly (make a helper function)
		database.registry.push(s.circle);
		database.hover[s.circle.id] = [s.circle.id, s.id];
		database.hover[s.id].push(s.circle.id);
	});


	new Vue({
		el: '#root',
		data: {
			viewBox: `0 0 ${width} ${height}`,
			center,
			stacks,
		},
		computed: {
			registryMap: function() {
				return database.registry.reduce((ret, obj) => { ret[obj.id] = obj; return ret; }, {});
			},
		},
		methods: {
			hoverEnd: function() {
				database.registry.forEach((obj) => { obj.active = false; });
				Vue.set(this, 'stacks', stacks.slice(0));
			},
			hoverStart: function(obj) {
				this.hoverEnd();
				(database.hover[obj.id] || []).forEach((id) => {
					this.registryMap[id].active = true;
				});
				Vue.set(this, 'stacks', stacks.slice(0));
			},

			// helper method so we don't need to pre-compute this specific string or do it inline
			translate: function(x, y) {
				return 'translate(' + x + ',' + y + ')';
			},
		},
	});
})();