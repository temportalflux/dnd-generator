import React from 'react';
import { Container } from "semantic-ui-react";
import { useRoutes } from 'raviger';
import Routes from './routes';
import shortid from 'shortid';
import TableCollection from './storage/TableCollection';
import { ViewContainer } from './view/ViewContainer';

export default function App()
{
	// https://kyeotic.github.io/raviger/
	const routeResult = useRoutes(Routes, { basePath: process.env.PUBLIC_URL });
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
			<ViewContainer page={window.location.pathname}>
				{routeResult}
			</ViewContainer>
		</Container>
	);
}
