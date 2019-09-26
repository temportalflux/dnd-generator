import React from 'react';
import lodash from 'lodash';
import { Container } from "semantic-ui-react";
import Home from './pages/index';

class App extends React.Component
{

	render()
	{
		return (
			<Container id={'App'} fluid>
				<Home/>
			</Container>
		);
	}

}

export default App;