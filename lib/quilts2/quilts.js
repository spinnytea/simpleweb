(function() {
	'use strict';
	// TODO unit testing
	// TODO lint

	const inputVue = new Vue({
		el: '#input',
		data: {
			squareSize: 3, // how big is the smallest square
			zoom: 16, // how much to zoom the picture

			globalOffsetX: 4,
			globalOffsetY: 4,
			globalOffsetR: 0,

			quiltWidth: 10,
			quiltHeight: 16,

			texture: [
				[
					{
						i: 0, j: 0, // NOTE redundant
						tris: [
							{ '0': [0,0], '1': [1,0], '2': [1,1], color: 'coral' },
							{ '0': [0,0], '1': [0,1], '2': [1,1], color: 'cornflowerblue' },
						],
					},
				],
			],
		},
		methods: {
			update: function() {
				quiltVue.rebuildMesh();
			},
		},
	});

	const quiltVue = new Vue({
		el: 'svg',
		data: {
			// TODO fill the screen with pixels
			//  - if any part of the square is on screen, then draw it
			mesh: [],
		},
		computed: {
			quiltWidth: function() { return +inputVue.quiltWidth; },
			quiltHeight: function() { return +inputVue.quiltHeight; },

			margin: function() { return 0.5; },
			svgWidth: function() { return (this.quiltWidth + 2*this.margin) * inputVue.zoom; },
			svgHeight: function() { return (this.quiltHeight + 2*this.margin) * inputVue.zoom; },
			viewBox: function() { return [-this.margin, -this.margin, this.quiltWidth+2*this.margin, this.quiltHeight+2*this.margin].join(' '); },
		},
		methods: {
			// TODO count pixels for metrics (don't worry about dups at first, just count and draw feedback)
			// TODO de-dup
			rebuildMesh: function() {
				this.mesh.splice(0);
				const si = 0; // TODO back up until off-quilt
				const sj = 0; // TODO back up until off-quilt
				const ei = si+1; // TODO move forward until off-quilt
				const ej = sj+1; // TODO move forward until off-quilt

				const ox = +inputVue.globalOffsetX;
				const oy = +inputVue.globalOffsetY;
				const rcos = Math.cos(inputVue.globalOffsetR);
				const rsin = Math.sin(inputVue.globalOffsetR);

				const s = +inputVue.squareSize;
				function transformX(i, x, j, y) {
					return ox + (x+i)*s*rcos - (y+j)*s*rsin;
				}
				function transformY(i, x, j, y) {
					return oy+ (x+i)*s*rsin + (y+j)*s*rcos;
				}

				for(let i = si; i < ei; i++) {
					for(let j = sj; j < ej; j++) {
						const m = { paths: [] };
						function transformXY(xy) { return transformX(i, xy[0], j, xy[1]) + ',' + transformY(i, xy[0], j, xy[1]); }

						let t = inputVue.texture[0][0]; // TODO dynamic index
						t.tris.forEach(function(tri) {
							const path = {
								d: 'M'+transformXY(tri[0])+' L'+transformXY(tri[1])+' L'+transformXY(tri[2])+' Z',
								fill: tri.color
							};
							m.paths.push(path);
						});

						this.mesh.push(m);
					}
				}
			},
		},
	});
	quiltVue.rebuildMesh();

	const metricsVue = new Vue({
		el: '#metrics',
		computed: {
			squareSize: function() { return +inputVue.squareSize; },
			cutSize: function() { return this.squareSize + 1; },
			quiltWidth: function() { return +inputVue.quiltWidth; },
			quiltHeight: function() { return +inputVue.quiltHeight; },
		},
	});
})();