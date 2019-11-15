import React from 'react';
import TableCollection from './storage/TableCollection';
import shortid from 'shortid';
import { Switch, Route } from "react-router-dom";
import { Container } from "semantic-ui-react";
import { HomeView } from './view/HomeView';
import { NpcView } from './view/NpcView';
import { DataView } from './view/DataView';

class App extends React.Component
{

	constructor(props)
	{
		super(props);
		this.state = { refreshKey: undefined };
		TableCollection.addOnChanged(this.onDataChanged.bind(this));
	}

	componentDidMount()
	{
		const tables = TableCollection.get();
		if (!tables)
		{
			TableCollection.initialize();
			this.setState({ refreshKey: shortid.generate() });
		}
	}

	onDataChanged({ detail })
	{
	}

	render()
	{
		return (
			<Container id={'App'} fluid>
				<Switch>
					<Route key='home' exact path='/' component={HomeView} />
					<Route key='npc' path='/npc' component={NpcView} />
					<Route key='data' path='/data/:table?' component={DataView} />
				</Switch>
			</Container>
		);
	}

}

export default App;