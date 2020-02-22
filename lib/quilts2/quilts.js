(function() {
	'use strict';
	// TODO unit testing
	// TODO lint

	const inputVue = new Vue({
		el: '#input',
		data: {
			squareSize: 6, // how big is each pixel (one part of a texture); the base unit of the quilt
			quiltWidth: 36, // size of the final quilt
			quiltHeight: 48, // size of the final quilt

			globalOffsetX: 4, // move the pattern around
			globalOffsetY: 4,
			globalOffsetR: 0.7,

			zoom: 8, // how much to zoom the picture (just a final svg thing)

			texture: [
				[
					{
						i: 0, j: 0, // NOTE redundant
						tris: [
							{ '0': [1,0], '1': [0,0], '2': [0,1], color: 'brown' },
							{ '0': [1,0], '1': [0,1], '2': [1,1], color: 'brown' },
						],
					},
					{
						i: 1, j: 0,
						tris: [
							{ '0': [0,0], '1': [0,1], '2': [1,1], color: 'cornflowerblue' },
							{ '0': [0,0], '1': [1,0], '2': [1,1], color: 'coral' },
						],
					},
				],
				[
					{
						i: 0, j: 1, // NOTE redundant
						tris: [
							{ '0': [0,0], '1': [0,1], '2': [1,1], color: 'coral' },
							{ '0': [0,0], '1': [1,0], '2': [1,1], color: 'cornflowerblue' },
						],
					},
					{
						i: 1, j: 1,
						tris: [
							{ '0': [1,0], '1': [0,0], '2': [0,1], color: 'cornflowerblue' },
							{ '0': [1,0], '1': [0,1], '2': [1,1], color: 'coral' },
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

			margin: function() { return 8; },
			svgWidth: function() { return (this.quiltWidth + 2*this.margin) * inputVue.zoom; },
			svgHeight: function() { return (this.quiltHeight + 2*this.margin) * inputVue.zoom; },
			viewBox: function() { return [-this.margin, -this.margin, this.quiltWidth+2*this.margin, this.quiltHeight+2*this.margin].join(' '); },
		},
		methods: {
			// TODO count pixels for metrics (don't worry about dups at first, just count and draw feedback)
			// TODO de-dup
			// TODO optimize
			// TODO maybe better variable names?
			rebuildMesh: function() {
				this.mesh.splice(0);

				const s = +inputVue.squareSize;
				const ox = +inputVue.globalOffsetX;
				const oy = +inputVue.globalOffsetY;
				const rcos = Math.cos(inputVue.globalOffsetR);
				const rsin = Math.sin(inputVue.globalOffsetR);

				// flood fill the map with squares
				const tryIJ = new Set(); // ij to check
				const doneIJ = new Set(); // ij that we have already checked
				function addIJ(i, j) {
					[-1,0,1].forEach((di) => [-1,0,1].forEach((dj) => {
						const k = [di+i,dj+j].join(',');
						if(!tryIJ.has(k) && !doneIJ.has(k)) tryIJ.add(k);
					}));
				}
				// TODO find a seed that's always on screen
				addIJ(Math.floor(-ox/s), Math.floor(-oy/s));

				// XXX this bounds check clips corners sometimes
				//  - it really only supports a rotate of -45, 0, +45
				const boundsCheck = [[0,0],[0,1],[1,0],[1,1],[0.5,0],[0.5,1],[0,0.5],[1,0.5]];
				// const boundsCheck = [];

				function transformX(i, x, j, y) {
					return ox + (x+i)*s*rcos - (y+j)*s*rsin;
				}
				function transformY(i, x, j, y) {
					return oy+ (x+i)*s*rsin + (y+j)*s*rcos;
				}
				function textureIdx(a, b) {
					return (a%b+b)%b;
				}

				while(tryIJ.size) {
					Array.from(tryIJ).forEach((ij) => {
						const [i, j] = ij.split(',').map((v) => +v);

						// mark this one as visited
						doneIJ.add(ij);
						tryIJ.delete(ij);

						const m = { paths: [] };
						function transformXX(xy) { return transformX(i, xy[0], j, xy[1]); }
						function transformYY(xy) { return transformY(i, xy[0], j, xy[1]); }
						function transformXY(xy) { return transformXX(xy) + ',' + transformYY(xy); }

						// if the whole square if off screen
						if(boundsCheck.length && boundsCheck.every((xy)=> {
							let x = transformXX(xy);
							let y = transformYY(xy);
							return x <= 0 || y <= 0 ||
								x >= this.quiltWidth || y >= this.quiltHeight;
						})) return;
						if(boundsCheck.length) addIJ(i, j);

						let t = inputVue.texture[textureIdx(j,inputVue.texture.length)][textureIdx(i,inputVue.texture[0].length)]; // TODO dynamic index
						t.tris.forEach((tri) => {
							const path = {
								d: 'M'+transformXY(tri[0])+' L'+transformXY(tri[1])+' L'+transformXY(tri[2])+' Z',
								fill: tri.color
							};
							m.paths.push(path);
						});

						this.mesh.push(m);
					});
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