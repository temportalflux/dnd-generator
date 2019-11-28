import React from 'react';
import { Container } from "semantic-ui-react";
import Routes from './routes';
import { HomeView } from "./view/HomeView";
import shortid from 'shortid';
import TableCollection from './storage/TableCollection';
import { ViewContainer } from './view/ViewContainer';
import { View } from './storage/Session';
import NpcData from './storage/NpcData';

function getRoute(view)
{
	if (Routes.hasOwnProperty(view)) return Routes[view]();
	else return (<HomeView />);
}

export default function App()
{
	const refreshWith = React.useState(undefined)[1];

	if (NpcData.getCurrentLinkData() !== undefined)
	{
		View.set("npc");
	}
 
	React.useEffect(() => {
		const onViewChanged = () => refreshWith(shortid.generate());
		View.subscribeOnChanged(onViewChanged);
		return () => {
			View.unsubscribeOnChanged(onViewChanged);
		};
	});

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
			<ViewContainer page={window.location.pathname}>
				{getRoute(View.get())}
			</ViewContainer>
		</Container>
	);
}
