(function() {
	'use strict';
	// TODO unit testing
	// TODO lint

	const COLOR_PRESETS = [
		// coral, cornflowerblue, gold, seargreen, firebrick
		'#ff7f50', '#6495ed', '#ffd700', '#2e8b57', '#b22222',
		// mediumpurple, sienna, palevioletred, ebony, ivory
		'#9370db', '#a0522d', '#db7093', '#282C34', '#fffff0',
	];

	const inputVue = new Vue({
		el: '#input',
		data: {
			squareSize: 4, // how big is each pixel (one part of a texture); the base unit of the quilt
			quiltWidth: 36, // size of the final quilt
			quiltHeight: 48, // size of the final quilt

			globalOffsetX: 0, // move the pattern around
			globalOffsetY: 0,
			globalOffsetR: 0,

			zoom: 8, // how much to zoom the picture (just a final svg thing)

			// the color palette defined by the user
			palette: COLOR_PRESETS.slice(0, 3),
			texture: [
				[
					{
						type: 'triF', // forward slash /
						shapes: [
							{ points: [[1,0], [0,0], [0,1]], color: 2 },
							{ points: [[1,0], [0,1], [1,1]], color: 1 },
						],
					},
					{
						type: 'triB', // back slash \
						shapes: [
							{ points: [[0,0], [0,1], [1,1]], color: 1 },
							{ points: [[0,0], [1,0], [1,1]], color: 0 },
						],
					},
				],
				[
					{
						type: 'triB', // back slash \
						shapes: [
							{ points: [[0,0], [0,1], [1,1]], color: 0 },
							{ points: [[0,0], [1,0], [1,1]], color: 1 },
						],
					},
					{
						type: 'triF', // forward slash /
						shapes: [
							{ points: [[1,0], [0,0], [0,1]], color: 1 },
							{ points: [[1,0], [0,1], [1,1]], color: 0 },
						],
					},
				],
			],
		},
		computed: {
			textureWidth: function() { return this.texture[0].length; },
			textureHeight: function() { return this.texture.length; },

			// NOTE 60->30, 75->15
			acos: function() { return Math.cos({0:0,15:15,30:30,45:45,60:30,75:15}[(+this.globalOffsetR+360) % 90] / 180 * Math.PI); },
			xmin: function() { return -this.xsnap * 2 * this.textureWidth; },
			xsnap: function() { return +this.squareSize/2 * this.acos; },
			xmax: function() { return +this.xsnap * 2 * this.textureWidth; },
			ymin: function() { return -this.ysnap * 2 * this.textureHeight; },
			ysnap: function() { return +this.squareSize/2 * this.acos; },
			ymax: function() { return +this.ysnap * 2 * this.textureHeight; },
		},
		methods: {
			update: function() {
				quiltVue.rebuildMesh();
			},
			addColor: function() { this.palette.push(COLOR_PRESETS[this.palette.length] || '#cccccc'); },
			rebuildTexture: function() {
				this.texture.forEach((row) => row.forEach((cell) => {
					cell.shapes.forEach((shape) => {
						shape.path = {
							d: 'M'+shape.points.map((p)=>p.join(',')).join('L')+'Z',
							fill: inputVue.palette[shape.color],
						};
					});
				}));
				Vue.set(this, 'texture', this.texture.slice(0));
			},

			clickTL: function(r, c) {
				console.log('tl', r, c);
			},
			clickTR: function(r, c) {
				console.log('tr', r, c);
			},
			clickBL: function(r, c) {
				console.log('bl', r, c);
			},
			clickBR: function(r, c) {
				console.log('br', r, c);
			},
			clickCenter: function(r, c) {
				console.log('center', r, c);
			},
		},
	});
	inputVue.rebuildTexture();

	const quiltVue = new Vue({
		el: '#quilt',
		data: {
			mesh: [],
		},
		computed: {
			quiltWidth: function() { return +inputVue.quiltWidth; },
			quiltHeight: function() { return +inputVue.quiltHeight; },

			margin: function() { return +inputVue.squareSize; },
			svgWidth: function() { return (this.quiltWidth + 2*this.margin) * inputVue.zoom; },
			svgHeight: function() { return (this.quiltHeight + 2*this.margin) * inputVue.zoom; },
			viewBox: function() { return [-this.margin, -this.margin, this.quiltWidth+2*this.margin, this.quiltHeight+2*this.margin].join(' '); },
		},
		methods: {
			// TODO count pixels for metrics (don't worry about dups at first, just count and draw feedback)
			//  - count both the overall square, and the individual shapes
			// TODO de-dup
			// TODO optimize
			// TODO maybe better variable names?
			rebuildMesh: function() {
				this.mesh.splice(0);

				const s = +inputVue.squareSize;
				const ox = +inputVue.globalOffsetX;
				const oy = +inputVue.globalOffsetY;
				const rcos = Math.cos(inputVue.globalOffsetR / 180 * Math.PI);
				const rsin = Math.sin(inputVue.globalOffsetR / 180 * Math.PI);

				// flood fill the map with squares
				const tryIJ = new Set(); // ij to check
				const doneIJ = new Set(); // ij that we have already checked
				function addIJ(i, j) {
					[-1,0,1].forEach((di) => [-1,0,1].forEach((dj) => {
						const k = [di+i,dj+j].join(',');
						if(!tryIJ.has(k) && !doneIJ.has(k)) tryIJ.add(k);
					}));
				}
				// seed the search based on the offset; try to get one that's on screen
				// XXX transformX is i,j -> x,y; make an x,y -> i,j
				addIJ(Math.floor(ox/s), Math.floor(oy/s));
				addIJ(Math.floor(-ox/s), Math.floor(oy/s));
				addIJ(Math.floor(ox/s), Math.floor(-oy/s));
				addIJ(Math.floor(-ox/s), Math.floor(-oy/s));

				// XXX this bounds check clips corners sometimes
				//  - it really only supports a rotate of -45, 0, +45
				const ZERO = 0.001; // because, computers and maths and round-off errors
				const ONE = 0.999; //
				const boundsCheck = [[ZERO,ZERO],[ZERO,ONE],[ONE,ZERO],[ONE,ONE],[0.5,ZERO],[0.5,ONE],[ZERO,0.5],[ONE,0.5]];

				function transformX(i, x, j, y) {
					return ox + (x+i)*s*rcos - (y+j)*s*rsin;
				}
				function transformY(i, x, j, y) {
					return oy + (x+i)*s*rsin + (y+j)*s*rcos;
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
							return x < 0 || y < 0 ||
								x > this.quiltWidth || y > this.quiltHeight;
						})) return;
						if(boundsCheck.length) addIJ(i, j);

						let t = inputVue.texture[textureIdx(j,inputVue.textureHeight)][textureIdx(i,inputVue.textureWidth)];
						t.shapes.forEach((shape) => {
							// TODO check each individual shape to see if it needs to be drawn
							const path = {
								d: 'M'+shape.points.map((p)=>transformXY(p)).join('L')+'Z',
								fill: inputVue.palette[shape.color],
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
			cutSize: function() { return +inputVue.squareSize + 1; },
			quiltWidth: function() { return (+inputVue.quiltWidth).toFixed(2); },
			quiltHeight: function() { return (+inputVue.quiltHeight).toFixed(2); },
		},
	});
})();