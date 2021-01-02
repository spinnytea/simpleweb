(function() {
	'use strict';

	const c = document.getElementById('c');
	const ctx = c.getContext('2d');

	const options = Object.freeze({
		len: 20,
		seedCount: 5,
		count: 50,
		baseTime: 10,
		addedTime: 10,
		dieChance: .05,
		spawnChance: .03,
		sparkChance: .1,
		sparkDist: 10,
		sparkSize: 2,

		color: 'hsl(hue,100%,light%)',
		baseLight: 50,
		addedLight: 10, // [50-10,50+10]
		shadowToTimePropMult: 6,
		baseLightInputMultiplier: .01,
		addedLightInputMultiplier: .02,

		repaintAlpha: .04,
		hueChange: .1,
	});

	function computeConstants() {
		const width = window.innerWidth;
		const height = window.innerHeight;
		const len = options.len;

		return Object.freeze({
			width: c.width = width,
			height: c.height = height,

			cx: width / 2,
			cy: height / 2,

			dieX: width / 2 / len,
			dieY: height / 2 / len,

			baseRad: Math.PI * 2 / 6,
		});
	}

	let constants = computeConstants();
	window.addEventListener('resize', function() { constants = computeConstants(); });

	let tick = 0;
	const lines = [];


	function Line(){
		this.reset();
	}
	Line.prototype.reset = function() {
		this.x = 0;
		this.y = 0;
		this.addedX = 0;
		this.addedY = 0;

		this.rad = 0;

		this.lightInputMultiplier = options.baseLightInputMultiplier + options.addedLightInputMultiplier + Math.random();

		this.color = options.color.replace('hue', tick * options.hueChange);
		this.comulativeTime = 0;

		this.beginPhase();
	};
	Line.prototype.beginPhase = function() {
		this.x += this.addedX;
		this.y += this.addedY;

		this.time = 0;
		this.targetTime = (options.baseTime + options.addedTime * Math.random()) |0;

		this.rad += constants.baseRad * (Math.random() < .5 ? 1 : -1);
		this.addedX = Math.cos(this.rad);
		this.addedY = Math.sin(this.rad);

		if(Math.random() < options.dieChance || this.x > constants.dieX || this.x < -constants.dieX || this.y > constants.dieY || this.y < -constants.dieY) {
			this.reset();
		}
	};
	Line.prototype.step = function() {
		this.time++;
		this.cumulativeTime++;

		if(this.time > this.targetTime) {
			this.beginPhase();
		}

		const alpha = this.time / this.targetTime;
		const wave = Math.sin(alpha * Math.PI / 2);
		const x = this.addedX * wave;
		const y = this.addedY * wave;

		ctx.shadowBlur = alpha * options.shadowToTimePropMult;
		ctx.fillStyle = ctx.shadowColor = this.color.replace('light', options.baseLight + options.addedLight * Math.sin(this.comulativeTime * this.lightInputMultiplier));
		ctx.fillRect(constants.cx + (this.x + x) * options.len, constants.cy + (this.y + y) * options.len, 2, 2);

		if(Math.random() < options.sparkChance) {
			ctx.fillRect(
				constants.cx
					+ (this.x + x) * options.len
					+ Math.random() * options.sparkDist * (Math.random() < .5 ? 1 : -1)
					- options.sparkSize / 2,
				constants.cy
					+ (this.y + y) * options.len
					+ Math.random() * options.sparkDist *(Math.random() < .5 ? 1 : -1)
					- options.sparkSize / 2,
				options.sparkSize,
				options.sparkSize
			);
		}
	};


	function loop() {
		tick++;

		ctx.globalCompositeOperation = 'source-over';
		ctx.shadowBlur = 0;
		ctx.fillStyle = `rgba(0,0,0,${options.repaintAlpha})`;
		ctx.fillRect(0, 0, constants.width, constants.height);

		if(lines.length < options.count && Math.random() < options.spawnChance) {
			lines.push(new Line());
		}

		ctx.globalCompositeOperation = 'lighter';
		lines.forEach(line => line.step());

		window.requestAnimationFrame(loop);
	}

	while(lines.length < options.seedCount) {
		lines.push(new Line());
	}

	loop();
})();
