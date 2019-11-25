import React from 'react';
import TableCollection from './storage/TableCollection';
import shortid from 'shortid';
import { Switch, Route } from "react-router-dom";
import { Container, Loader } from "semantic-ui-react";
import { HomeView } from './view/HomeView';
import { NpcView } from './view/NpcView';
import { DataView } from './view/DataView';

export default function App(props)
{
	const refreshWith = React.useState(undefined)[1];

	React.useEffect(() =>
	{
		function onTableCollectionChanged()
		{
			refreshWith(shortid.generate());
		};
		TableCollection.addOnChanged(onTableCollectionChanged);
		return () =>
		{
			TableCollection.removeOnChanged(onTableCollectionChanged);
		}
	});

	if (!TableCollection.get())
	{
		TableCollection.initialize();
	}

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
