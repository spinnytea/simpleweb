window['structured-links-database'] = {
	registry: [
		{ id: 'stack-data',   display: 'Data',         type: 'stack-level' },
		{ id: 'stack-lang',   display: 'Language',     type: 'stack-level' },
		{ id: 'stack-fw',     display: 'Framework',    type: 'stack-level' },
		{ id: 'stack-markup', display: 'Markup',       type: 'stack-level' },
		{ id: 'stack-comp',   display: 'Compilation',  type: 'stack-level' },
		{ id: 'stack-dist',   display: 'Distribution', type: 'stack-level' },
		{ id: 'stack-build',  display: 'Build',        type: 'stack-level' },

		// Data: REST, HTTP, HTTP/2, AJAX, Fetch, Request, Axios
		{ id: 'data-rest',     display: 'REST',    type: 'library', link: 'https://www.w3.org/2001/sw/wiki/REST' },
		{ id: 'data-http',     display: 'HTTP',    type: 'library', link: 'https://www.w3schools.com/whatis/whatis_http.asp' },
		{ id: 'data-http2',    display: 'HTTP/2',  type: 'library', link: 'https://developers.google.com/web/fundamentals/performance/http2' },
		{ id: 'data-ajax',     display: 'AJAX',    type: 'library', link: 'https://www.w3schools.com/xml/ajax_intro.asp' },
		{ id: 'data-fetch',    display: 'Fetch',   type: 'library', link: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API' },
		{ id: 'data-requerst', display: 'Request', type: 'library', link: 'https://developer.mozilla.org/en-US/docs/Web/API/Request' },
		{ id: 'data-axios',    display: 'Axios',   type: 'library', link: 'https://github.com/axios/axios' },

		// Language: Javascript, Typescript, Flow, CoffeeScript, WebAssembly
		{ id: 'lang-javascript', display: 'JavaScript',   type: 'library', link: 'https://www.w3schools.com/js/DEFAULT.asp' },
		{ id: 'lang-typescript', display: 'TypeScript',   type: 'library', link: 'https://www.typescriptlang.org/' },
		{ id: 'lang-flow',       display: 'Flow',         type: 'library', link: 'https://flow.org/' },
		{ id: 'lang-coffee',     display: 'CoffeeScript', type: 'library', link: 'https://coffeescript.org/' },
		{ id: 'lang-webasm',     display: 'WebAssembly',  type: 'library', link: 'https://developer.mozilla.org/en-US/docs/WebAssembly' },

		// Framework: jQuery, Angular, VueJS, RxJS, React, ReactDOM
		{ id: 'fw-jquery',    display: 'jQuery',    type: 'library', link: 'https://jquery.com/' },
		{ id: 'fw-angularjs', display: 'AngularJs', type: 'library', link: 'https://docs.angularjs.org/api' },
		{ id: 'fw-angular2',  display: 'Angular',   type: 'library', link: 'https://angular.io/docs' },
		{ id: 'fw-vue',       display: 'VueJS',     type: 'library', link: 'https://vuejs.org/v2/guide/' },
		{ id: 'fw-rxjs',      display: 'RxJS',      type: 'library', link: 'https://www.learnrxjs.io/' },
		{ id: 'fw-react',     display: 'React',     type: 'library', link: 'https://reactjs.org/' },
		{ id: 'fw-reactdom',  display: 'ReactDOM',  type: 'library', link: 'https://reactjs.org/docs/react-dom.html' },

		// Markup: JSX, XML, DOM, HTML
		{ id: 'markup-jsx',  display: 'JSX',  type: 'library', link: 'https://www.w3schools.com/react/react_jsx.asp' },
		{ id: 'markup-xml',  display: 'XML',  type: 'library', link: 'https://www.w3schools.com/xml/xml_whatis.asp' },
		{ id: 'markup-dom',  display: 'DOM',  type: 'library', link: 'https://www.w3schools.com/js/js_htmldom.asp' },
		{ id: 'markup-html', display: 'HTML', type: 'library', link: 'https://www.w3schools.com/html/html_intro.asp' },

		// Compilation: Babel, Browserify, eslint
		{ id: 'comp-babel',      display: 'Babel',      type: 'library', link: 'https://babeljs.io/docs/en/' },
		{ id: 'comp-browserify', display: 'Browserify', type: 'library', link: 'https://github.com/browserify/browserify' },
		{ id: 'comp-eslint',     display: 'eslint',     type: 'library', link: 'https://eslint.org/' },

		// Distribution: CDN, Bower, npm
		{ id: 'dist-cdn',   display: 'CDN',   type: 'library', link: 'https://en.wikipedia.org/wiki/Content_delivery_network' },
		{ id: 'dist-bower', display: 'Bower', type: 'library', link: 'https://bower.io/' },
		{ id: 'dist-npm',   display: 'npm',   type: 'library', link: 'https://www.npmjs.com/' },

		// Build: Grunt, Gulp, Broccoli, Mimosa, Makefiles, Webpack
		{ id: 'build-grunt',    display: 'Grunt',    type: 'library', link: 'https://gruntjs.com/' },
		{ id: 'build-gulp',     display: 'Gulp',     type: 'library', link: 'https://gulpjs.com/' },
		{ id: 'build-broccoli', display: 'Broccoli', type: 'library', link: 'https://github.com/broccolijs/broccoli' },
		{ id: 'build-mimosa',   display: 'Mimosa',   type: 'library', link: 'http://mimosa.io/' },
		{ id: 'build-makefile', display: 'Makefile', type: 'library', link: '' },
		{ id: 'build-webpack',  display: 'Webpack',  type: 'library', link: 'https://webpack.js.org/' },
	],
	stack: {
		'stack-data': ['data-rest', 'data-http', 'data-http2', 'data-ajax', 'data-fetch', 'data-requerst', 'data-axios'],
		'stack-lang': ['lang-javascript', 'lang-typescript'],
		'stack-fw': ['fw-jquery', 'fw-angularjs', 'fw-angular2', 'fw-vue', 'fw-rxjs', 'fw-react', 'fw-reactdom'],
		'stack-markup': ['markup-jsx', 'markup-xml', 'markup-dom', 'markup-html'],
		'stack-comp': ['comp-babel', 'comp-browserify', 'comp-eslint'],
		'stack-dist': ['dist-cdn', 'dist-bower', 'dist-npm'],
		'stack-build': ['build-grunt', 'build-gulp', 'build-broccoli', 'build-mimosa', 'build-makefile', 'build-webpack'],
	},
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
})();