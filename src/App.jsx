import React from 'react';
import DataStorage from './storage/DataStorage';
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
		DataStorage.addOnChanged(this.onDataChanged.bind(this));
	}

	loadData()
	{
		console.log('Loading data tables');
		const data = new DataStorage();
		data.loadTables();
		data.save();
		this.setState({ refreshKey: shortid.generate() });
	}

	componentDidMount()
	{
		const tables = DataStorage.get();
		if (tables === null)
		{
			this.loadData();
		}
	}

	onDataChanged({ detail })
	{
		// data is being cleared
		if (detail.next === null)
		{
			this.loadData();
		}
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