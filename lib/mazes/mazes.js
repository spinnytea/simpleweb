(function() {
	const MAZE_DOOR_DELAY = 50;
	const MAZE_MOVE_DELAY = 100;

	function rand(min, max) { return Math.floor(Math.random()*(1+max-min)+min); };
	function randIdx(array) { return Math.floor(Math.random()*array.length); }
	function pickRand(array) { return array[randIdx(array)]; }
	function pullRand(array) { return array.splice(randIdx(array), 1)[0]; }
	function shuffle(array) {
		array = array.slice(0); // copy array since we are going to mutate it
		const shuffled = []; // new array for storing the randomized array
		while(array.length) shuffled.push(pullRand(array));
		return shuffled;
	};

	/* some boilerplate code for an async loop */
	function nextPromiseTimeout(callback, delay) {
		return (function next() {
			return new Promise((resolve) => {
				clearTimeout(nextPromiseTimeout.timeoutId);
				nextPromiseTimeout.timeoutId = setTimeout(() => {
					callback(next, resolve);
				}, delay);
			});
		})();
	}

	function makeCell(y, x) {
		return {
			// position information
			// in case we need it
			y: y,
			x: x,

			// basic state information
			// i.e. unvisited, visited, active
			// TODO 4 goals, one in each corner
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
	function getCellIfGoal(board, y, x, color) {
		if(!board || !board[y]) return undefined;
		const cell = board[y][x];
		if(!cell) return undefined;
		if(cell.class === color) return cell;
		return undefined;
	}

	const maze = new Vue({
		el: '#maze',
		data: {
			// how big to make the maze
			// this is just for the UI controls and initialization
			// after init, use board directly
			height: 9,
			width: 16,
			type: 'depthFirst',

			// a matrix of maze cells
			// board[y][x]
			board: undefined,

			// player x,y; where the player is now
			x: 1,
			y: 1,
			live: false,
			auto: true,
		},
		computed: {
			// the cell where the player is now
			active: function() { return this.board[this.y][this.x]; },
			red: function() { return getCellIfGoal(this.board, 0, 0, 'red'); },
			yellow: function() { return getCellIfGoal(this.board, 0, this.board_width-1, 'yellow'); },
			green: function() { return getCellIfGoal(this.board, this.board_height-1, 0, 'green'); },
			blue: function() { return getCellIfGoal(this.board, this.board_height-1, this.board_width-1, 'blue'); },

			board_height: function() { if(!this.board) return 3; return this.board.length; },
			board_width: function() { if(!this.board) return 3; return this.board[0].length; },
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

				board[0][0].class = 'red';
				board[0][cols-1].class = 'yellow';
				board[rows-1][0].class = 'green';
				board[rows-1][cols-1].class = 'blue';

				Vue.set(this, 'board', board);
			},

			makeNewBoard: function() {
				this.live = false;
				try {
					this.makeEmptyBoard();
				} catch(e) {
					console.error(e);
					this.live = true;
					return;
				}
				let fn;
				switch(this.type) {
					case 'prim': fn = prim; break;
					case 'kruskal': fn = kruskal; break;
					case 'depthFirst': fn = depthFirst; break;
					default: fn = example; break;
				}
				return fn().then(() => {
					this.start();
				});
			},
			/** when board is ready to be played */
			start: function() {
				this.y = rand(1, this.board_height-2);
				this.x = rand(1, this.board_width-2);
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

			keyToMove: function(dir) {
				if(!this.live) return;
				// stop async things
				clearTimeout(nextPromiseTimeout.timeoutId);
				// move
				this.move(dir);
			},
			moveToCell: function(cell) {
				if(!this.live) return;
				if(!cell) return;
				movePath(findPath((head) => head === cell));
			},

			// TODO if wandering, then stop
			// find a path to follow, follow it, repeat
			wander: function() {
				if(!this.live) return;

				// find a nearby dead end
				// TODO exit early if we have to pass over a visited space
				//  - which shouldn't happen when finding the closeset unvisited; just this time
				let path = findPath((head, visited) => {
					// unvisited and nowhere else to go
					return head.class !== 'visited' && head.class !== 'active' &&
						dirs.every((dir) => !head[dir] || visited.has(head[dir]));
				}, 4);

				if(!path) {
					// find the closest unvisited node
					path = findPath((head) => head.class !== 'visited' && head.class !== 'active');
				}

				if(path) {
					return movePath(path).then(() => {
						this.wander();
					});
				}
				else {
					if(this.auto) {
						return nextPromiseTimeout((next, resolve) => resolve(), MAZE_MOVE_DELAY)
							.then(() => this.makeNewBoard()) // make a new board
							.then(() => this.wander()); // start wandering again
					} else {
						return Promise.resolve();
					}
				}
			},
		},
		mounted: function() {
			window.addEventListener('keydown', (e) => {
				if(e.target.tagName.toLowerCase() === 'input') return;
				switch(e.keyCode) {
					// arrows
					case 37: this.keyToMove('w'); break;
					case 38: this.keyToMove('n'); break;
					case 39: this.keyToMove('e'); break;
					case 40: this.keyToMove('s'); break;
					// generate
					case 78: /* n */ this.makeNewBoard(); break;
					// goals
					case 82: /* r */ case 49: /* 1 */ this.moveToCell(this.red); break;
					case 89: /* y */ case 50: /* 2 */ this.moveToCell(this.yellow); break;
					case 71: /* g */ case 51: /* 3 */ this.moveToCell(this.green); break;
					case 66: /* b */ case 52: /* 4 */ this.moveToCell(this.blue); break;
					// wander
					case 87: /* w */ this.wander(); break;
					// default: console.log(e.keyCode);
				}
			});
		},
	});

	// seed the maze
	maze.makeNewBoard();


	/* generate mazes */
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
		maze.makeEmptyBoard();

		// wait, get another door, use it, repeat until finished
		return nextPromiseTimeout((next, resolve) => {
			const [y1, x1, dir, y2, x2] = pullRand(doors);
			maze.door(
				maze.board[y1][x1],
				dir,
				maze.board[y2][x2] // we could use getCell, but this was written way before
			);
			if(doors.length) next().then(resolve);
			else resolve();
		}, MAZE_DOOR_DELAY);
	}

	/**
	 * basically randomized breadth first
	 * simple, efficient, but mazes are too simplistic
	 */
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

		return nextPromiseTimeout((next, resolve) => {
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
	}

	/**
	 * completely random
	 * elegant algorithm, but uninteresting mazes
	 * too many short paths
	 * it's like fully mixed coffee+milk, we want a maze that's half-way mixed
	 */
	function kruskal() {
		// start of with each cell in it's own set
		const sets = new Map();
		for(let y = 0; y < maze.board_height; y++)
			for(let x = 0; x < maze.board_width; x++)
				sets.set(maze.board[y][x], maze.board[y][x]);

		// get and flatten the cell's head
		function getHead(cell) {
			if(sets.get(cell) === cell) {
				// if it points to itself
				return cell; // then this is the head
			} else {
				// if it points to something else
				const head = getHead(sets.get(cell)); // get the head of that
				sets.set(cell, head); // flatten
				return head; // return that head
			}
		}

		// start with every single door we could possibly knock down
		const doors = [];
		for(let y = 0; y < maze.board_height; y++)
			for(let x = 0; x < maze.board_width-1; x++)
				doors.push([maze.board[y][x], 'e', maze.board[y][x+1]]);
		for(let y = 0; y < maze.board_height-1; y++)
			for(let x = 0; x < maze.board_width; x++)
				doors.push([maze.board[y][x], 's', maze.board[y+1][x]]);

		return nextPromiseTimeout((next, resolve) => {
			let [cell, dir, other] = pullRand(doors);

			// keep pulling off items that are attached
			// (we don't want a MAZE_DOOR_DELAY where we do nothing)
			while(getHead(cell) === getHead(other) && doors.length) {
				[cell, dir, other] = pullRand(doors);
			}

			// attach
			if(getHead(cell) !== getHead(other)) {
				maze.door(cell, dir, other);
				sets.set(getHead(cell), other);
			}

			if(doors.length) next().then(resolve);
			else resolve();
		}, MAZE_DOOR_DELAY);
	}

	/**
	 */
	function depthFirst() {
		const frontier = [];

		/** add doors to the frontier for cells that are not already attached */
		function addDoors(cell) {
			shuffle(dirs).forEach(function(dir) {
				const other = getCell(maze.board, cell, dir);
				if(other && !isAttached(other)) {
					frontier.push([cell, dir, other]);
				}
			});
		}
		addDoors(pickRand(pickRand(maze.board)));

		let cellsSinceReset = 0;
		return nextPromiseTimeout((next, resolve) => {
			let [cell, dir, other] = frontier.pop();

			// BUG cellsSinceReset isn't fool proof
			//  - it's obvious when cellsSinceReset > 0 or cellsSinceReset > 1
			//  - it becomes less and less likely as you increase the threshold
			//  - maybe we need to check if the door leads to a dead end
			//  - maybe once the threshold gets high enough, the bug disapears

			// if we get to the end, pick a random place to start
			// (we don't want a MAZE_DOOR_DELAY where we do nothing)
			while((cellsSinceReset > 10 || isAttached(other)) && frontier.length) {
				[cell, dir, other] = pullRand(frontier);
				cellsSinceReset = 0;
			}

			if(!isAttached(other)) {
				maze.door(cell, dir, other);
				addDoors(other);
				cellsSinceReset++;
			}

			if(frontier.length) next().then(resolve);
			else resolve();
		}, MAZE_DOOR_DELAY);
	}


	/* explore */

	function findPath(goalFn, maxLength) {
		const visited = new Set();
		const queue = [[maze.active, []]];

		while(queue.length) {
			let [head, path] = queue.shift(); // take the existing (shorter) items from the front

			// if we found the goal, return the current path
			if(goalFn(head, visited)) {
				return path;
			}

			visited.add(head);

			// if we didn't find the goal, then extend the current path
			if(maxLength === undefined || path.length < maxLength) {
				shuffle(dirs).forEach((dir) => {
					const nextHead = head[dir];
					if(nextHead && !visited.has(nextHead)) {
						const nextPath = path.slice(0);
						nextPath.push(dir);
						queue.push([nextHead, nextPath]); // add the new (longer) items to the end
					}
				});
			}
		}

		return undefined;
	}

	function movePath(path) {
		if(!path) return;
		path = path.reverse();

		return nextPromiseTimeout((next, resolve) => {
			let dir = path.pop();

			if(maze.active[dir]) {
				maze.move(dir);
			} else {
				// invalid path
				path.splice(0);
				return resolve();
			}

			if(path.length) next().then(resolve);
			else resolve();
		}, MAZE_MOVE_DELAY);
	}
})();
