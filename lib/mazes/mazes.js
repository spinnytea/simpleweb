(function() {
	function makeCell(y, x) {
		return {
			// position information
			// in case we need it
			y: y,
			x: x,

			// basic state information
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
		cell.style['border-' + cssDir[dir]] = 'none';

		const odir = reverseDir[dir];
		other[odir] = cell;
		other.style['border-' + cssDir[odir]] = 'none';
	}

	var maze = new Vue({
		el: '#maze',
		data: {
			// how big to make the maze
			height: 3,
			width: 4,
			board: [],

			// player x,y
			x: 1,
			y: 1,
			live: false,
		},
		computed: {
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
				this.board = board;
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

			// keys
			move: function(dir) {
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

	// TODO algorithms to automate
	door(maze.board[0][0], 'e', maze.board[0][1]);
	door(maze.board[0][1], 's', maze.board[1][1]);
	door(maze.board[1][0], 'e', maze.board[1][1]);
	door(maze.board[1][2], 'w', maze.board[1][1]);
	door(maze.board[1][2], 's', maze.board[2][2]);
	door(maze.board[2][3], 'w', maze.board[2][2]);
	door(maze.board[2][3], 'n', maze.board[1][3]);
	door(maze.board[0][3], 's', maze.board[1][3]);
	door(maze.board[0][3], 'w', maze.board[0][2]);
	door(maze.board[2][2], 'w', maze.board[2][1]);
	door(maze.board[2][0], 'e', maze.board[2][1]);

	maze.start();
})();
