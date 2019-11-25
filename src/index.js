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
console.log(`Serving at public url: ${process.env.PUBLIC_URL}`);

// basename is required because the apge is being served under github pages (aliased to a domain site).
// TODO: Maybe switch out of browser router? https://blog.logrocket.com/how-react-hooks-can-replace-react-router/
ReactDOM.render((
	<BrowserRouter basename={process.env.PUBLIC_URL}>
		<App />
	</BrowserRouter>
), document.getElementById('root'));