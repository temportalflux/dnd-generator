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

ReactDOM.render(<BrowserRouter><App /></BrowserRouter>, document.getElementById('root'));