import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import 'semantic-ui-css/semantic.min.css';

// https://www.npmjs.com/package/semver
console.log('Versions:', {
	react: React.version,
	node: process.versions.node,
});
console.log(`Serving at public url: ${process.env.PUBLIC_URL}`);

ReactDOM.render((
	<App />
), document.getElementById('root'));