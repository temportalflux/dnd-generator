import React from 'react';
import { ViewContainer } from './ViewContainer';
import DataStorage from '../storage/DataStorage';
import { Container, Header } from 'semantic-ui-react';

export class DataView extends React.Component
{

	hasTableKey()
	{
		return this.props.match.params.table !== undefined;
	}

	getTable()
	{
		const tableCollection = DataStorage.get();
		if (!tableCollection) { return undefined; }
		const tableKey = this.props.match.params.table;
		return tableKey !== undefined ? tableCollection.getTable(tableKey) : undefined;
	}

	render()
	{
		return (
			<ViewContainer page={this.props.location.pathname}>
				{this.renderContent()}
			</ViewContainer>
		);
	}

	renderContent()
	{
		if (!this.hasTableKey())
		{
			// TODO: List of all the tables & their descriptions
			return (
				'TODO: Render all the table keys + descriptions'
			);
		}
		else
		{
			console.log(DataStorage.get());
			const table = this.getTable();
			console.log(table);
			if (table === undefined)
			{
				return '403: No table found';
			}
			else
			{
				return (
					<Container>
						<Header>{table.key}</Header>
					</Container>
				);
			}
		}
	}

}