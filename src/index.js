import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import 'semantic-ui-css/semantic.min.css';
import packageJson from '../package.json';

// https://www.npmjs.com/package/semver
console.log('Versions:', {
	react: React.version,
	node: process.versions.node,
	app: packageJson.version,
});
console.log(`Serving at public url: ${process.env.PUBLIC_URL}`);

ReactDOM.render((
	<App />
), document.getElementById('root'));