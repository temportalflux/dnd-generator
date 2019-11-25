import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter } from "react-router-dom";
import 'semantic-ui-css/semantic.min.css';

// https://www.npmjs.com/package/semver
console.log('Versions:', {
	react: React.version,
	node: process.versions.node,
});

// basename is required because the apge is being served under github pages (aliased to a domain site).
ReactDOM.render((
	<BrowserRouter basename="/dnd-generator">
		<App />
	</BrowserRouter>
), document.getElementById('root'));