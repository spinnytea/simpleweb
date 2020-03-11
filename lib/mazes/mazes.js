(function() {
	const MAZE_DOOR_DELAY = 100;

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

	const reverseDir = { 'n': 's', 's': 'n', 'e': 'w', 'w': 'e' };
	const cssDir = { 'n': 'top', 's': 'bottom', 'e': 'right', 'w': 'left' };
	function door(cell, dir, other) {
		cell[dir] = other;
		cell.style['border-' + cssDir[dir] + '-color'] = 'rgba(0,0,0,0)';

		const odir = reverseDir[dir];
		other[odir] = cell;
		other.style['border-' + cssDir[odir] + '-color'] = 'rgba(0,0,0,0)';
	}

	var maze = new Vue({
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

	// TODO more algorithms
	example().then(() => {
		maze.start();
	});

	/* generate mazes */
	void(example);

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
					const [y1, x1, dir, y2, x2] = doors.pop();
					maze.door(
						maze.board[y1][x1],
						dir,
						maze.board[y2][x2]
					);
					if(doors.length) next().then(resolve);
					else resolve();
				}, MAZE_DOOR_DELAY);
			});
		})();
	}
})();
