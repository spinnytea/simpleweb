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

	// forward slash /
	function createTriF([c1, c2]) {
		if(c2 === undefined) c2 = c1;
		return {
			type: 'triF',
			shapes: [
				{ points: [[1,0], [0,0], [0,1]], color: c1 },
				{ points: [[1,0], [0,1], [1,1]], color: c2 },
			],
		};
	}
	// back slash \
	function createTriB([c1, c2]) {
		if(c2 === undefined) c2 = c1;
		return {
			type: 'triB',
			shapes: [
				{ points: [[0,0], [1,0], [1,1]], color: c1 },
				{ points: [[0,0], [0,1], [1,1]], color: c2 },
			],
		};
	}
	function createSqu([c1]) {
		return {
			type: 'squ',
			shapes: [
				{ points: [[0,0], [1,0], [1,1], [0,1]], color: c1 },
			],
		};
	}

	// TODO save/load data from inputVue so the pattern can be shared
	//  - this is a large object; compress it
	const inputVue = new Vue({
		el: '#input',
		data: {
			squareSize: 4, // how big is each pixel (one part of a texture); the base unit of the quilt
			quiltWidth: 36, // size of the final quilt
			quiltHeight: 48, // size of the final quilt

			globalOffsetX: 0, // move the pattern around
			globalOffsetY: 0,
			globalOffsetR: 0,

			// the color palette defined by the user
			palette: COLOR_PRESETS.slice(0, 4),
			selectedColor: 0,

			// dev testing
			// tCols: 2,
			// tRows: 2,
			// texture: [
			// 	[ createTriF([2, 1]), createTriB([0, 1]) ],
			// 	[ createTriB([1, 0]), createTriF([1, 0]) ],
			// ],

			// researched
			tCols: 4,
			tRows: 4,
			texture: [
				[ createSqu([1]), createSqu([1]), createSqu([0]), createSqu([0]) ],
				[ createSqu([1]), createSqu([2]), createSqu([0]), createSqu([0]) ],
				[ createSqu([3]), createSqu([2]), createSqu([2]), createSqu([1]) ],
				[ createSqu([3]), createSqu([3]), createSqu([1]), createSqu([1]) ],
			],
		},
		computed: {
			textureWidth: function() { return this.texture[0].length; },
			textureHeight: function() { return this.texture.length; },

			qwsnap: function() { return this.xsnap.toFixed(2); },
			qhsnap: function() { return this.xsnap.toFixed(2); },

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
				this.rebuildTexture();
				quiltVue.rebuildMesh();
			},
			addColor: function() { this.palette.push(COLOR_PRESETS[this.palette.length] || '#cccccc'); },
			resizeTexture: function() {
				const t = this.texture;
				const w = +this.tCols;
				const h = +this.tRows;
				if(t[0].length > w) {
					t.forEach((row) => row.splice(w));
				}
				if(t.length > h) {
					t.splice(h);
				}

				const empty = new Array(w).fill(0, 0, w);
				if(t[0].length < w) {
					t.forEach((row) => Array.prototype.push.apply(row, empty.slice(row.length).map(() => createSqu([0]))));
				}
				if(t.length < h) {
					while(t.length < h) t.push(empty.map(() => createSqu([0])));
				}
				this.update();
			},
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
				let cell = this.texture[r][c];
				if(cell.type !== 'triF') {
					cell = this.texture[r][c] = createTriF(cell.shapes.map((s)=>s.color));
				}
				cell.shapes[0].color = this.selectedColor;
				this.update();
			},
			clickTR: function(r, c) {
				let cell = this.texture[r][c];
				if(cell.type !== 'triB') {
					cell = this.texture[r][c] = createTriB(cell.shapes.map((s)=>s.color));
				}
				cell.shapes[0].color = this.selectedColor;
				this.update();
			},
			clickBL: function(r, c) {
				let cell = this.texture[r][c];
				if(cell.type !== 'triB') {
					cell = this.texture[r][c] = createTriB(cell.shapes.map((s)=>s.color));
				}
				cell.shapes[1].color = this.selectedColor;
				this.update();
			},
			clickBR: function(r, c) {
				let cell = this.texture[r][c];
				if(cell.type !== 'triF') {
					cell = this.texture[r][c] = createTriF(cell.shapes.map((s)=>s.color));
				}
				cell.shapes[1].color = this.selectedColor;
				this.update();
			},
			clickCenter: function(r, c) {
				let cell = this.texture[r][c];
				if(cell.type !== 'squ') {
					cell = this.texture[r][c] = createSqu(cell.shapes.map((s)=>s.color));
				}
				cell.shapes[0].color = this.selectedColor;
				this.update();
			},
		},
	});

	const quiltVue = new Vue({
		el: '#quilt',
		data: {
			zoom: 8, // how much to zoom the picture (just a final svg thing)
			mesh: [],
		},
		computed: {
			quiltWidth: function() { return +inputVue.quiltWidth; },
			quiltHeight: function() { return +inputVue.quiltHeight; },

			margin: function() { return +inputVue.squareSize; },
			svgWidth: function() { return (this.quiltWidth + 2*this.margin) * this.zoom; },
			svgHeight: function() { return (this.quiltHeight + 2*this.margin) * this.zoom; },
			viewBox: function() { return [-this.margin, -this.margin, this.quiltWidth+2*this.margin, this.quiltHeight+2*this.margin].join(' '); },
		},
		methods: {
			// XXX maybe better variable names?
			rebuildMesh: function() {
				this.mesh.splice(0);
				metricsVue.resetCounts();

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
						metricsVue.addCount(t);

						this.mesh.push(m);
					});
				}
			},

			shareButton: function() {
				share();
			},
		},
	});

	const metricsVue = new Vue({
		el: '#metrics',
		data: {
			counts: {},
		},
		computed: {
			squareSize: function() { return +inputVue.squareSize; },
			cutSize: function() { return +inputVue.squareSize + 1; },
			quiltWidth: function() { return (+inputVue.quiltWidth).toFixed(2); },
			quiltHeight: function() { return (+inputVue.quiltHeight).toFixed(2); },
		},
		methods: {
			resetCounts: function() {
				this.counts = {};
			},
			addCount: function(t) {
				const colors = t.shapes.map((s)=>s.color).sort();
				const swatch = (() => { switch(t.type) {
					case 'triF':
					case 'triB':
						if(colors[0] === colors[1]) {
							return {
								key: 'squ-'+colors[0],
								count: 1,
								shapes: createSqu(colors).shapes,
							};
						} else {
							return {
								key: 'tri-' + colors.join('-'),
								count: 1,
								shapes: createTriF(colors).shapes,
							};
						}
					case 'squ':
						return {
							key: 'squ-'+colors[0],
							count: 1,
							shapes: createSqu(colors).shapes,
						};
					default:
						return {
							key: 'unknown',
							count: 1,
							shapes: createSqu(['black']).shapes,
						};
				}})();

				swatch.shapes.forEach((shape) => {
					shape.path = {
						d: 'M'+shape.points.map((p)=>p.join(',')).join('L')+'Z',
						fill: inputVue.palette[shape.color],
					};
				});

				if(this.counts[swatch.key]) {
					this.counts[swatch.key].count++;
				} else {
					this.counts[swatch.key] = swatch;
				}
			},
		},
	});

	// init
	load();

	// save and load
	// NOTE it would be nice if i could use gzip or something
	//  - i haven't found a library I can use with just a script tag
	function encodeInputVue(data) {
		const textureTypeMap = { 'squ': 's', 'triF': 'f', 'triB': 'b' };
		const textureData = data.texture.map((row) => row.map((t) => {
			const colors = t.shapes.map((s)=>s.color);
			return textureTypeMap[t.type] + '-' + colors.join('-');
		}));
		const plaintext = [
			1, // version
			+data.squareSize,
			+data.quiltWidth, +data.quiltHeight,
			+data.globalOffsetX, +data.globalOffsetY, +data.globalOffsetR,
			data.palette.join(','), // palette is minimal already, selectedColor doesn't matter
			textureData, // tCols, tRows are derived values
		];
		const str = JSON.stringify(plaintext);
		const encoded = btoa(str);
		return encoded;
	}
	function decodeInputVue(encoded) {
		const plaintext = JSON.parse(atob(encoded))
			.reverse();

		// while encode only needs to support one version
		// decode needs to support all past versions
		const data = {};

		const version = plaintext.pop();
		switch(version) {
			case 1:
				// version 1 decode
				// squareSize
				data.squareSize = +plaintext.pop();
				// quiltWidth, quiltHeight
				data.quiltWidth = +plaintext.pop();
				data.quiltHeight = +plaintext.pop();
				// globalOffsetX, globalOffsetY, globalOffsetR
				data.globalOffsetX = +plaintext.pop();
				data.globalOffsetY = +plaintext.pop();
				data.globalOffsetR = +plaintext.pop();
				// palette
				data.palette = plaintext.pop().split(',');
				data.selectedColor = 0;
				// texture
				const v1TextureTypeMap = { 's': createSqu, 'f': createTriF, 'b': createTriB };
				data.texture = plaintext.pop().map((row) => row.map((cell) => {
					const colors = cell.split('-');
					const createType = v1TextureTypeMap[colors.shift()];
					return createType(colors.map((c) => +c));
				}));
				data.tCols = data.texture[0].length;
				data.tRows = data.texture.length;
				break;
			default:
				throw new Error('unsupported data version');
		}

		if(plaintext.length !== 0) throw new Error('invalid data: plaintext.length');

		return data;
	}

	function share() {
		// TODO an alert or something
		console.log(location.protocol + '//' + location.host + location.pathname + '?d=' + encodeInputVue(inputVue._data));
	}
	function load() {
		const urlParams = new URLSearchParams(window.location.search);
		const encoded = urlParams.get('d');
		if(encoded) {
			try {
				// tCols, tRows, texture
				// TODO validate values
				// TODO test each value independently
				const data = decodeInputVue(encoded);
				if(!!data.squareSize) Vue.set(inputVue, 'squareSize', data.squareSize);
				if(!!data.quiltWidth) Vue.set(inputVue, 'quiltWidth', data.quiltWidth);
				if(!!data.quiltHeight) Vue.set(inputVue, 'quiltHeight', data.quiltHeight);
				if(data.hasOwnProperty('globalOffsetX')) Vue.set(inputVue, 'globalOffsetX', data.globalOffsetX);
				if(data.hasOwnProperty('globalOffsetY')) Vue.set(inputVue, 'globalOffsetY', data.globalOffsetY);
				if(data.hasOwnProperty('globalOffsetR')) Vue.set(inputVue, 'globalOffsetR', data.globalOffsetR);
				if(!!data.palette) Vue.set(inputVue, 'palette', data.palette);
				Vue.set(inputVue, 'selectedColor', 0); // just in case we load after the page is already setup
				if(!!data.texture) {
					Vue.set(inputVue, 'texture', data.texture);
					Vue.set(inputVue, 'tCols', data.texture[0].length);
					Vue.set(inputVue, 'tRows', data.texture.length);
				}
			} catch(e) {
				console.error('invalid data', e);
			}
		}
		inputVue.update();
	}
})();