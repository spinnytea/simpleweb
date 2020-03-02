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
		};
	}

	var maze = new Vue({
		el: '#maze',
		data: {
			// how big to make the maze
			height: 3,
			width: 4,
			board: [],
		},
		computed: {
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
		},
	});
	maze.makeEmptyBoard();
})();
