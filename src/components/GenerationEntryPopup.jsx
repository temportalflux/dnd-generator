import React from 'react';
import { Form, Divider, Grid, Header } from 'semantic-ui-react';
import lodash from 'lodash';

export default class GenerationEntryPopup extends React.Component
{

	isObjectEmpty(obj)
	{
		return lodash.isEmpty(obj);
	}

	renderIf(condition, component)
	{
		return condition ? component : <span/>;
	}

	createModifiersTable(modifiersObject)
	{
		const rows = Object.keys(modifiersObject).map((entryPath) => (
			<div key={entryPath}>
				{entryPath}:
				{JSON.stringify(modifiersObject[entryPath])}
			</div>
		));
		return (
			<div>
				<Header as='h5'>Modifiers</Header>
				{rows}
			</div>
		)
	}

	render()
	{
		const { entry } = this.props;
		const localContext = entry.getLocalContext();
		return (
			<div>

				<Header as='h5'>Path</Header>
				{entry.getPath()}

				<Divider />

				{this.renderIf(!this.isObjectEmpty(localContext), (
					<div>
						<Header as='h5'>Local Context</Header>
						{JSON.stringify(localContext, null, 2)}
						<Divider />
					</div>
				))}

				{this.renderIf(entry.collection !== undefined, (
					<div>
						<Header as='h5'>Collection</Header>
						{entry.collection}
						<Divider />
					</div>
				))}

				{this.renderIf(!this.isObjectEmpty(entry.modifiers), (
					this.createModifiersTable(entry.modifiers)
				))}

				{this.renderIf(entry.hasCollectionEntries(), (
					<div>
						<Header as='h5'>Collection Entries</Header>
						{entry.getCollectionEntries()}
						<Divider />
					</div>
				))}

			</div>
		);
	}

}