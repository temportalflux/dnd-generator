import React, { useState, useEffect } from 'react';
import { ViewContainer } from './ViewContainer';
import TableCollection from '../storage/TableCollection';
import { Loader, Dropdown, Segment } from 'semantic-ui-react';
import shortid from 'shortid';
import { TableFilter } from '../components/TableFilter';

//import {Npc} from './pages/Npc';
// <Npc/>

export function NpcView(props)
{
	const [refreshKey, refreshWith] = useState(0);

	useEffect(() => {
		function onTableCollectionChanged({detail}) {
			refreshWith(shortid.generate());
		};
		TableCollection.addOnChanged(onTableCollectionChanged);
		return () => {
			TableCollection.removeOnChanged(onTableCollectionChanged);
		}
	});

	console.log('Rendering npc view');

	const tableCollection = TableCollection.get();
	if (!tableCollection)
	{
		return (
			<ViewContainer page={props.location.pathname}>
				<Loader active>Loading</Loader>
			</ViewContainer>
		);
	}

	return (
		<ViewContainer page={props.location.pathname}>
			
			<Segment>
				
				<TableFilter tableKey='identity/sex' />

			</Segment>

		</ViewContainer>
	);
}
