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
				<Divider />
			</div>
		)
	}

	createModifiedByTable(modifiersList)
	{
		const rows = modifiersList.map((entryPath) => (
			<div key={entryPath}>
				{entryPath}: {JSON.stringify(this.props.entry.generator.getEntry(entryPath).modifiers[this.props.entry.getPath()])}
			</div>
		));
		return (
			<div>
				<Header as='h5'>Modified By</Header>
				{rows}
				<Divider />
			</div>
		)
	}

	createStringifyDependenciesTable(stringifyDependenciesList)
	{
		const rows = stringifyDependenciesList.map((entryPath) => (
			<div key={entryPath}>
				{entryPath}
			</div>
		));
		return (
			<div>
				<Header as='h5'>Stringify Dependent On</Header>
				{rows}
				<Divider />
			</div>
		)
	}

	createStringifyUsageTable(usedInStringifyBy)
	{
		const rows = usedInStringifyBy.map((entryPath) => (
			<div key={entryPath}>
				{entryPath}
			</div>
		));
		return (
			<div>
				<Header as='h5'>String Used By</Header>
				{rows}
				<Divider />
			</div>
		)
	}

	render()
	{
		const { entry } = this.props;
		const localContext = entry.getLocalContext();
		const stringifyDependencies = entry.getStringifyDependencies();
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

				{this.renderIf(!this.isObjectEmpty(entry.modifiedBy), (
					this.createModifiedByTable(entry.modifiedBy)
				))}

				{this.renderIf(!this.isObjectEmpty(stringifyDependencies), (
					this.createStringifyDependenciesTable(stringifyDependencies)
				))}

				{this.renderIf(!this.isObjectEmpty(entry.usedInStringifyBy), (
					this.createStringifyUsageTable(entry.usedInStringifyBy)
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