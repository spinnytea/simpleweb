(function() {
	'use strict';

	class TextScramble {
		constructor(el) {
			this.el = el;
			this.chars = '~!<>-_\\/[]{}=+*^?#________';
			this.delay = 40;
			this.duration = 40;
			this.swapDudRate = 0.28;
		}
		randomDud() {
			return this.chars[Math.floor(Math.random() * this.chars.length)]
		}

		setText(newText) {
			const oldText = this.el.innerText;
			const length = Math.max(newText.length, oldText.length);
			const promise = new Promise(resolve => this.resolve = resolve);

			// break the text into one instructions per char
			this.queue = [];
			for(let i = 0; i < length; i++) {
				const start = Math.floor(Math.random() * this.delay);
				this.queue.push({
					from: oldText[i] || '',
					to: newText[i] || '',
					start,
					end: start + Math.floor(Math.random() * this.duration),
				});
			}

			// reset
			cancelAnimationFrame(this.frameRequest);
			this.frame = 0;

			// start
			this.nextFrame();
			return promise;
		}

		nextFrame() {
			let output = '';
			let complete = 0;
			this.queue.forEach(({ from, to, start, end, char }, i) => {
				if(this.frame >= end) {
					complete++;
					output += to;
				} else if(this.frame >= start) {
					if(!char || Math.random() < this.swapDudRate) {
						this.queue[i].char = char = this.randomDud();
					}
					output += `<span class="dud">${char}</span>`
				} else {
					output += from;
				}
			});

			this.el.innerHTML = output;

			if(complete === this.queue.length) {
				cancelAnimationFrame(this.frameRequest);
				this.resolve();
			} else {
				this.frame++;
				this.frameRequest = requestAnimationFrame(() => this.nextFrame());
			}
		}
	}

	// Example

	const phrases = [
		'Neo,',
		'sooner or later',
		'you\'re going to realize',
		'just as I did',
		'that there\'s a difference',
		'between knowing the path',
		'and walking the path',
	 ];

	 const el = document.querySelector('.text');
	 const fx = new TextScramble(el);

	 let index = 0;
	 function next() {
		 fx.setText(phrases[index]).then(() => {
			 setTimeout(next, 800);
		 });
		 index = (index + 1) % phrases.length;
	 }

	 next();
})();