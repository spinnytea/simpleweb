window['structured-links-database'] = {
	registry: [
		{ id: 'stack-data',   display: 'Data',         type: 'stack-level', description: 'How we get data from the server.' },
		{ id: 'stack-lang',   display: 'Language',     type: 'stack-level', description: 'What "programming language" are using? At the end of the day, it\'s all javascript, but there are various dialects.' },
		{ id: 'stack-fw',     display: 'Framework',    type: 'stack-level', description: 'UI Framework. Tools, features, patterns for cohesive development.' },
		{ id: 'stack-markup', display: 'Markup',       type: 'stack-level', description: 'Static markup for the laying out the page. All of these are XML based.' },
		{ id: 'stack-comp',   display: 'Compilation',  type: 'stack-level', description: 'How do we compile our code? Javascript is, well, a scripting language. But we can still have post-processors to check and and clean things up.' },
		{ id: 'stack-dist',   display: 'Distribution', type: 'stack-level', description: 'How do we share our code? Where do we get libraries from the community.' },
		{ id: 'stack-build',  display: 'Build',        type: 'stack-level', description: 'The build pipeline for packaging everything together. While compilation focuses on processing javascript, this is more about packaging the whole project together for release.' },
		{ id: 'stack-import', display: 'Import',       type: 'stack-level', description: 'Ways of describing how to import various javascript files into one larger file.' },

		// Data: REST, HTTP, HTTP/2, AJAX, Fetch, Request, Axios
		{ id: 'data-rest',     display: 'REST',    type: 'library', link: 'https://www.w3.org/2001/sw/wiki/REST' },
		{ id: 'data-http',     display: 'HTTP',    type: 'library', link: 'https://www.w3schools.com/whatis/whatis_http.asp' },
		{ id: 'data-http2',    display: 'HTTP/2',  type: 'library', link: 'https://developers.google.com/web/fundamentals/performance/http2' },
		{ id: 'data-ajax',     display: 'AJAX',    type: 'library', link: 'https://www.w3schools.com/xml/ajax_intro.asp' },
		{ id: 'data-fetch',    display: 'Fetch',   type: 'library', link: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API' },
		{ id: 'data-requerst', display: 'Request', type: 'library', link: 'https://developer.mozilla.org/en-US/docs/Web/API/Request' },
		{ id: 'data-axios',    display: 'Axios',   type: 'library', link: 'https://github.com/axios/axios' },

		// Language: Javascript, Typescript, CoffeeScript, WebAssembly
		{ id: 'javascript', display: 'JavaScript',   type: 'library', link: 'https://www.w3schools.com/js/DEFAULT.asp' },
		{ id: 'es5',        display: 'ES5',          type: 'library', link: 'https://www.w3schools.com/js/js_es5.asp' },
		{ id: 'es7',        display: 'ES2016',       type: 'library', link: 'https://en.wikipedia.org/wiki/ECMAScript#7th_Edition_%E2%80%93_ECMAScript_2016' },
		{ id: 'typescript', display: 'TypeScript',   type: 'library', link: 'https://www.typescriptlang.org/' },
		{ id: 'coffee',     display: 'CoffeeScript', type: 'library', link: 'https://coffeescript.org/' },
		{ id: 'webasm',     display: 'WebAssembly',  type: 'library', link: 'https://developer.mozilla.org/en-US/docs/WebAssembly' },

		// Framework: jQuery, Angular, VueJS, RxJS, React, ReactDOM
		{ id: 'jquery',    display: 'jQuery',    type: 'library', link: 'https://jquery.com/' },
		{ id: 'angularjs', display: 'AngularJs', type: 'library', link: 'https://docs.angularjs.org/api' },
		{ id: 'angular2',  display: 'Angular',   type: 'library', link: 'https://angular.io/docs' },
		{ id: 'vue',       display: 'VueJS',     type: 'library', link: 'https://vuejs.org/v2/guide/' },
		{ id: 'rxjs',      display: 'RxJS',      type: 'library', link: 'https://www.learnrxjs.io/' },
		{ id: 'react',     display: 'React',     type: 'library', link: 'https://reactjs.org/' },
		{ id: 'reactdom',  display: 'ReactDOM',  type: 'library', link: 'https://reactjs.org/docs/react-dom.html' },

		// Markup: JSX, XML, DOM, HTML
		{ id: 'jsx',  display: 'JSX',  type: 'library', link: 'https://www.w3schools.com/react/react_jsx.asp' },
		{ id: 'xml',  display: 'XML',  type: 'library', link: 'https://www.w3schools.com/xml/xml_whatis.asp' },
		{ id: 'dom',  display: 'DOM',  type: 'library', link: 'https://www.w3schools.com/js/js_htmldom.asp' },
		{ id: 'html', display: 'HTML', type: 'library', link: 'https://www.w3schools.com/html/html_intro.asp' },

		// Compilation: Babel, Browserify, eslint, Flow
		{ id: 'babel',      display: 'Babel',      type: 'library', link: 'https://babeljs.io/docs/en/' },
		{ id: 'browserify', display: 'Browserify', type: 'library', link: 'https://github.com/browserify/browserify' },
		{ id: 'eslint',     display: 'eslint',     type: 'library', link: 'https://eslint.org/' },
		{ id: 'flow',       display: 'Flow',       type: 'library', link: 'https://flow.org/' },

		// Distribution: CDN, Bower, npm
		{ id: 'cdn',   display: 'CDN',   type: 'library', link: 'https://en.wikipedia.org/wiki/Content_delivery_network' },
		{ id: 'bower', display: 'Bower', type: 'library', link: 'https://bower.io/' },
		{ id: 'npm',   display: 'npm',   type: 'library', link: 'https://www.npmjs.com/' },

		// Build: Grunt, Gulp, Broccoli, Mimosa, Makefiles, Webpack
		{ id: 'grunt',    display: 'Grunt',    type: 'library', link: 'https://gruntjs.com/' },
		{ id: 'gulp',     display: 'Gulp',     type: 'library', link: 'https://gulpjs.com/' },
		{ id: 'broccoli', display: 'Broccoli', type: 'library', link: 'https://github.com/broccolijs/broccoli' },
		{ id: 'mimosa',   display: 'Mimosa',   type: 'library', link: 'http://mimosa.io/' },
		{ id: 'makefile', display: 'Makefile', type: 'library', link: '' },
		{ id: 'webpack',  display: 'Webpack',  type: 'library', link: 'https://webpack.js.org/' },

		// Import: AMD, CommonJS, SystemJS
		{ id: 'amd',      display: 'AMD',      type: 'library', link: 'https://requirejs.org/docs/whyamd.html' },
		{ id: 'commonjs', display: 'CommonJS', type: 'library', link: 'https://requirejs.org/docs/commonjs.html' },
		{ id: 'systemjs', display: 'SystemJS', type: 'library', link: 'https://github.com/systemjs/systemjs' },
	],
	stack: {
		'stack-data': ['data-rest', 'data-http', 'data-http2', 'data-ajax', 'data-fetch', 'data-requerst', 'data-axios'],
		'stack-lang': ['javascript', 'es5', 'es7', 'typescript', 'coffee', 'webasm'],
		'stack-fw': ['jquery', 'angularjs', 'angular2', 'vue', 'rxjs', 'react', 'reactdom'],
		'stack-markup': ['jsx', 'xml', 'dom', 'html'],
		'stack-comp': ['babel', 'browserify', 'eslint', 'flow'],
		'stack-dist': ['cdn', 'bower', 'npm'],
		'stack-build': ['grunt', 'gulp', 'broccoli', 'mimosa', 'makefile', 'webpack'],
		'stack-import': ['amd', 'commonjs', 'systemjs'],
	},

	// hover is populated form hoverSets
	hover: {},
	hoverSets: [
		['typescript', 'webpack', 'systemjs', 'babel'],
		['vendor-face', 'react', 'reactdom', 'flow'],
		['reactdom', 'dom', 'jsx'],
		['react', 'reactdom', 'babel'],
	],
};

// validate the data
// TODO put these errors on the UI in some way, not just console.error
(function() {
	const database = window['structured-links-database'];

	database.registry.forEach((obj) => {
		if(obj.type === 'library' && !obj.link) console.warn('library does not have a link', obj);
	});

	const registryMap = database.registry.reduce((ret, obj) => {
		if(ret[obj.id]) console.error('dup id in registry', obj.id + ' already exists', ret[obj.id], obj);
		ret[obj.id] = obj;
		return ret;
	}, {});

	Object.keys(database.stack).forEach(function(key) {
		addHover(key, database.stack[key].concat([key]));
		database.stack[key] = database.stack[key].map((id) => {
			if(id in registryMap) {
				return registryMap[id];
			} else {
				console.error('database.stack id does not exist', key, id);
				return id;
			}
		});

		if(key in registryMap) {
			registryMap[key].children = database.stack[key];
		} else {
			console.error('could not find stack key in registry', key);
		}
	});

	database.hoverSets.forEach((set) => {
		set.forEach((key) => {
			if(key in registryMap) {
				addHover(key, set);
			} else {
				console.error('could not find hohver key in registry', key);
			}
		});
	});

	function addHover(key, list) {
		if(database.hover[key]) {
			database.hover[key] = database.hover[key].concat(list);
		} else {
			database.hover[key] = list.slice(0);
		}
	}
})();