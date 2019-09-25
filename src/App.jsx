import React from 'react'
import { Root, Routes } from 'react-static'
import { Router } from '@reach/router'

import 'semantic-ui-css/semantic.min.css';

export default class App extends React.Component
{

	render()
	{
		return (
			<Root>
				<React.Suspense fallback={<em>Loading...</em>}>
					<Router>
						<Routes path="*" />
					</Router>
				</React.Suspense>
			</Root>
		);
	}

}
