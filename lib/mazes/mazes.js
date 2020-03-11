(function() {
	const MAZE_DOOR_DELAY = 100;

	function rand(min, max) { return Math.floor(Math.random()*(1+max-min)+min); };
	function randIdx(array) { return Math.floor(Math.random()*array.length); }
	function pickRand(array) { return array[randIdx(array)]; }
	function pullRand(array) { return array.splice(randIdx(array), 1)[0]; }

	function makeCell(y, x) {
		return {
			// position information
			// in case we need it
			y: y,
			x: x,

			// basic state information
			// i.e. unvisited, visited, active
			class: 'unvisited',

			// doors to other rooms
			// pointers to the adjacent room
			n: null,
			s: null,
			e: null,
			w: null,
			// style based on doors
			style: {},
		};
	}

	const dirs = ['n', 's', 'e', 'w'];
	const reverseDir = { 'n': 's', 's': 'n', 'e': 'w', 'w': 'e' };
	const cssDir = { 'n': 'top', 's': 'bottom', 'e': 'right', 'w': 'left' };
	function door(cell, dir, other) {
		cell[dir] = other;
		cell.style['border-' + cssDir[dir] + '-color'] = 'rgba(0,0,0,0)';

		const odir = reverseDir[dir];
		other[odir] = cell;
		other.style['border-' + cssDir[odir] + '-color'] = 'rgba(0,0,0,0)';
	}
	function getCell(board, cell, dir) {
		switch(dir) {
			case 'n': return (board[cell.y-1] ? board[cell.y-1][cell.x] : undefined);
			case 's': return (board[cell.y+1] ? board[cell.y+1][cell.x] : undefined);
			case 'e': return board[cell.y][cell.x+1];
			case 'w': return board[cell.y][cell.x-1];
			default: return undefined;
		};
	}
	function isAttached(cell) {
		return dirs.some((dir) => !!cell[dir]);
	}

	const maze = new Vue({
		el: '#maze',
		data: {
			// how big to make the maze
			// this is just for the UI controls and initialization
			// after init, use board directly
			height: 5,
			width: 5,

			// a matrix of maze cells
			// board[y][x]
			board: [],

			// player x,y; where the player is now
			x: 1,
			y: 1,
			live: false,
		},
		computed: {
			// the cell where the player is now
			active: function() { return this.board[this.y][this.x]; },
		},
		methods: {
			makeEmptyBoard: function() {
				const rows = +this.height;
				const cols = +this.width;
				if(rows < 3) throw new Error('maze height cannot be less than 3');
				if(cols < 3) throw new Error('maze width cannot be less than 3');

				const board = [];
				while(board.length < rows) {
					const row = [];
					while(row.length < cols) {
						const cell = makeCell(board.length, row.length);
						row.push(cell);
					}
					board.push(row);
				}
				Vue.set(this, 'board', board);
			},

			/** when starting a new board */
			init: function() {
				this.live = false;
				this.makeEmptyBoard();
			},
			/** when board is ready to be played */
			start: function() {
				this.y = rand(1, this.board.length-2);
				this.x = rand(1, this.board[0].length-2);
				this.active.class = 'active';
				this.live = true;
			},

			door: function(...args) {
				door.apply(null, args);
				Vue.set(this, 'board', this.board.slice(0));
			},

			// keys
			move: function(dir) {
				if(!this.live) return;
				const cell = this.active;
				const next = cell[dir];
				if(next) {
					cell.class = 'visited';
					next.class = 'active';
					this.y = next.y;
					this.x = next.x;
				}
			},
		},
		mounted: function() {
			window.addEventListener('keydown', (e) => {
				switch(e.keyCode) {
					case 37: this.move('w'); break;
					case 38: this.move('n'); break;
					case 39: this.move('e'); break;
					case 40: this.move('s'); break;
				}
			});
		},
	});
	maze.init();

	prim().then(() => {
		maze.start();
	});


	/* generate mazes */
	void(example);
	void(prim);
	// void(kruskal);
	// void(depthFirst);
	// TODO more algorithms

	function example() {
		const doors = [
			[0, 0, 'e', 0, 1],
			[0, 1, 's', 1, 1],
			[1, 0, 'e', 1, 1],
			[1, 2, 'w', 1, 1],
			[1, 2, 's', 2, 2],
			[2, 3, 'w', 2, 2],
			[2, 3, 'n', 1, 3],
			[0, 3, 's', 1, 3],
			[0, 3, 'w', 0, 2],
			[2, 2, 'w', 2, 1],
			[2, 0, 'e', 2, 1],
		];

		// the example needs a very specific size...
		maze.height = 3;
		maze.width = 4;
		// ...so we need to init again
		maze.init();

		// wait, get another door, use it, repeat until finished
		return (function next() {
			return new Promise((resolve) => {
				setTimeout(() => {
					const [y1, x1, dir, y2, x2] = pullRand(doors);
					maze.door(
						maze.board[y1][x1],
						dir,
						maze.board[y2][x2] // we could use getCell, but this was written way before
					);
					if(doors.length) next().then(resolve);
					else resolve();
				}, MAZE_DOOR_DELAY);
			});
		})();
	}

	function prim() {
		const frontier = [];

		/** add doors to the frontier for cells that are not already attached */
		function addDoors(cell) {
			dirs.forEach(function(dir) {
				const other = getCell(maze.board, cell, dir);
				if(other && !isAttached(other)) {
					frontier.push([cell, dir, other]);
				}
			});
		}
		addDoors(pickRand(pickRand(maze.board)));

		return (function next() {
			return new Promise((resolve) => {
				setTimeout(() => {
					let [cell, dir, other] = pullRand(frontier);

					// keep pulling off items that are attached
					// (we don't want a MAZE_DOOR_DELAY where we do nothing)
					while(isAttached(other) && frontier.length) {
						[cell, dir, other] = pullRand(frontier);
					}

					if(!isAttached(other)) {
						maze.door(cell, dir, other);
						addDoors(other);
					}

					if(frontier.length) next().then(resolve);
					else resolve();
				}, MAZE_DOOR_DELAY);
			});
		})();
	}
})();
