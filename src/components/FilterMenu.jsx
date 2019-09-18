import React from 'react';
import { Segment, Grid, Form } from 'semantic-ui-react';
import lodash from 'lodash';
const { randomEntry, categories } = require('../Data');

export default class FilterMenu extends React.Component
{

	constructor(props)
	{
		super(props);

		this.onChangeField = this.onChangeField.bind(this);
		this.onGenerate = this.onGenerate.bind(this);
		this.makeCategoryRow = this.makeCategoryRow.bind(this);
		this.makeFieldColumn = this.makeFieldColumn.bind(this);

		this.state = {
			categories: categories,
			data: categories.reduce((accum, category) =>
			{
				return category.fields.reduce((accumField, field) =>
				{
					lodash.set(accumField, field.key, randomEntry.value);
					return accumField;
				}, accum);
			}, {})
		};
	}

	onChangeField(evt, { name, value })
	{
		let data = this.state.data;
		lodash.set(data, name, value);

		this.state.categories.forEach((category) =>
		{
			category.fields.forEach((field) =>
			{
				if (field.dependsOn.includes(name))
				{
					lodash.set(data, field.key, randomEntry.value);
				}
			});
		});

		this.setState({ data: data });
	}

	onGenerate()
	{
		this.props.generate(this.state.data);
	}

	makeCategoryRow(category)
	{
		return (
			<Grid.Row key={category.key} id={category.key}>
				{category.fields.map(this.makeFieldColumn)}
			</Grid.Row>
		);
	}

	makeFieldColumn(field)
	{
		const fieldOptions = field.getOptions(this.state.data);
		const options = [randomEntry, ...fieldOptions];
		return (
			<Grid.Column key={field.key}>
				{fieldOptions.length > 0 &&
					<Form.Select
						fluid search selection
						name={field.key}
						label={field.text}
						options={options}
						onChange={this.onChangeField}
						value={lodash.get(this.state.data, field.key)}
					/>
				}
			</Grid.Column>
		);
	}

	render()
	{
		return (
			<Segment>
				<Form onSubmit={this.onGenerate}>
					<Grid columns={this.state.categories.length + 1}>
						{this.state.categories.map(this.makeCategoryRow)}
						<Grid.Row>
							<Grid.Column>
								<Form.Button>Generate</Form.Button>
							</Grid.Column>
						</Grid.Row>
					</Grid>
				</Form>
			</Segment>
		);
	}

}