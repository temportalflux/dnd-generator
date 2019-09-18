import React from 'react';
import { Segment, Grid, Form } from 'semantic-ui-react';
import lodash from 'lodash';
const { randomEntry, makeEntry, categories } = require('../Data');

export default class FilterMenu extends React.Component
{

	constructor(props)
	{
		super(props);

		this.onChangeField = this.onChangeField.bind(this);
		this.onFilter = this.onFilter.bind(this);

		this.state = {
			categories: categories.map((category) => ({
				key: category.key,
				name: category.name,
				fields: category.filters.map((filter) =>
				{
					return {
						name: `${category.key}.${filter.key}`,
						text: filter.name,
						value: randomEntry.value,
						options: Array.isArray(filter.values)
							? filter.values.map((entry) => makeEntry(entry, entry))
							: lodash.mapValues(filter.values, (values) => values.map((entry) => makeEntry(entry, entry)))
					};
				})
			}))
		};
	}

	onChangeField(field, value)
	{
		/*
		let delta = { [field]: value };

		delta = lodash.mapValues(delta, (value) => ({ value: value }));
		delta[field].options = Data.tables[field];

		const newState = lodash.assignIn({}, this.state, delta);
		newState.subrace.options = Data.tables.subrace[newState.race.value] || [Data.randomEntry];
		newState.professionTypes.options = Data.tables.professionTypes[newState.profession.value] || [Data.randomEntry];
		this.setState(newState);
		//*/
	}

	onFilter()
	{
		//this.props.generate(lodash.mapValues(this.state, (value) => value.value));
	}

	makeField(text, name)
	{
		const field = this.state[name];
		return (
			<Form.Select
				label={text}
				fluid search selection
				value={field.value}
				options={field.options}
				onChange={(evt, { value }) => this.onChangeField(name, value)}
			/>
		);
	}

	makeCategoryRow(category)
	{
		//{category.fields.map(this.makeFieldColumn)}
		return (
			<Grid.Row id={category.key} name={category.name}>
				
			</Grid.Row>
		);
	}

	makeFieldColumn(field)
	{
		return (
			<Grid.Column>
				<Form.Select
					name={field.name}
					value={field.value}
					label={field.text}
					fluid search selection
					options={field.options}
					onChange={(evt, { value }) => this.onChangeField(name, value)}
				/>
			</Grid.Column>
		);
	}

	render()
	{
		/*
		<Grid.Row>
			<Grid.Column>{this.makeField('Race', 'race')}</Grid.Column>
			<Grid.Column
				style={{ display: this.state.race.value == 'random' || this.state.subrace.options.length <= 0 ? 'none' : 'block' }}
			>{this.makeField('Subrace', 'subrace')}</Grid.Column>
		</Grid.Row>

		<Grid.Row>
			<Grid.Column>{this.makeField('Sex', 'sex')}</Grid.Column>
			<Grid.Column>{this.makeField('Alignment', 'forcealign')}</Grid.Column>
			<Grid.Column>{this.makeField('Plot Hooks', 'hooks')}</Grid.Column>
		</Grid.Row>

		<Grid.Row>
			<Grid.Column>{this.makeField('Occupation', 'occupation')}</Grid.Column>
			<Grid.Column
				style={{ display: this.state.occupation.value == 'class' ? 'block' : 'none' }}
			>{this.makeField('Class', 'class')}</Grid.Column>
			<Grid.Column
				style={{ display: this.state.occupation.value == 'profession' ? 'block' : 'none' }}
			>{this.makeField('Social Class', 'profession')}</Grid.Column>
			<Grid.Column
				style={{ display: this.state.profession.value == 'random' ? 'none' : 'block' }}
			>{this.makeField('Profession', 'professionTypes')}</Grid.Column>
		</Grid.Row>

		<Grid.Row>
			<Grid.Column>
				<Form.Button>Generate</Form.Button>
			</Grid.Column>
		</Grid.Row>
		*/
		return (
			<Segment>
				<Form onSubmit={this.onFilter}>
					<Grid columns={this.state.categories.length}>
						{this.state.categories.map(this.makeCategoryRow)}
					</Grid>
				</Form>
			</Segment>
		);
	}

}