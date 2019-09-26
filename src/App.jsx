import React from 'react';
import lodash from 'lodash';
import { Container } from "semantic-ui-react";
import {Npc} from './pages/Npc';

class App extends React.Component
{

	render()
	{
		return (
			<Container id={'App'} fluid>
				<Npc/>
			</Container>
		);
	}

}

export default App;