import React from 'react';
import { Container } from "semantic-ui-react";
import {Npc} from './pages/Npc';
import DataStorage from './storage/DataStorage';

class App extends React.Component
{

	componentDidMount()
	{
		new DataStorage().ayeep();
	}

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