import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import 'semantic-ui-css/semantic.min.css';
import packageJson from '../package.json';
import IDB from './storage/IDB';

// https://www.npmjs.com/package/semver
console.log('Versions:', {
	react: React.version,
	node: process.versions.node,
	app: packageJson.version,
});
console.log(`Serving at public url: ${process.env.PUBLIC_URL}`);

if (!window.indexedDB)
{
	console.warn("Your browser doesn't support a stable version of IndexedDB. TODO indicate which feature(s) will not be available.");
}

let db = new IDB('npc_db', 1, (db, oldVersion, newVersion) => {
	
});

window.onload = function() {
	db.open();
};

ReactDOM.render((
	<App />
), document.getElementById('root'));
