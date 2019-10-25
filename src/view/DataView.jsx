import React from 'react';
import { ViewContainer } from './ViewContainer';
import DataTableView from '../components/DataTableView';
import DataStorage from '../storage/DataStorage';

export class DataView extends React.Component
{

	getTableKey()
	{
		return this.props.match.params.table;
	}

	hasTableKey()
	{
		return this.getTableKey() !== undefined;
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
			console.log(DataStorage.get());
			// TODO: List of all the tables & their descriptions
			return (
				'TODO: Render all the table keys + descriptions'
			);
		}
		else
		{
			return (
				<DataTableView tableKey={this.getTableKey()} />
			);
		}
	}

}