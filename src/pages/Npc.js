import React from 'react'
//import { Grid } from 'semantic-ui-react';
//import FilterMenu from '../components/FilterMenu';
import DisplayNpc from '../components/DisplayNpc';
import { generate } from '../generator/index';
import NpcDataTree from '../components/NpcDataTree';
import lodash from 'lodash';
import { Generator, GenerationEntry } from '../generator/Generator';
import { Tab } from 'semantic-ui-react';

const { getTable } = require('../Data');

export class Npc extends React.Component
{

	constructor(props)
	{
		super(props);
		this.generate = this.generate.bind(this);
		this.onRerollClicked = this.onRerollClicked.bind(this);

		const npc = getTable('npc');
		const generator = new Generator();

		npc.fieldOrder.forEach((entryData) =>
		{
			generator.addEntry(new GenerationEntry(lodash.assign({}, entryData, { generator: generator })));
		});

		generator.setGenerationOrder(npc.generationOrder || []);
		generator.generate();

		this.state = {
			generator: generator
		};
	}

	generate(filter)
	{
		this.setState({
			generator: generate(filter)
		});
	}

	onRerollClicked(evt, { path })
	{
		this.regenerate(path);
	}

	async regenerate(path)
	{
		const generator = this.state.generator;
		if (path === 'npc')
		{
			generator.generate();
		}
		else
		{
			generator.regenerate(path);
		}
		this.setState({ generator: generator });
	}

	render()
	{
		/*
				<Grid columns={2}>
					<Grid.Row>
						<Grid.Column>
							<FilterMenu
								generate={this.generate}
							/>
						</Grid.Column>
					</Grid.Row>
				</Grid>
		
						<Grid.Column>
							
						</Grid.Column>

		*/
		const panes = [
			{
				menuItem: 'Article',
				render: () => (
					<Tab.Pane>
						<DisplayNpc
							generator={this.state.generator}
							onRerollClicked={this.onRerollClicked}
						/>
					</Tab.Pane>
				)
			},
			{
				menuItem: 'Data',
				render: () => (
					<Tab.Pane>
						<NpcDataTree
							generator={this.state.generator}
							onRerollClicked={this.onRerollClicked}
						/>
					</Tab.Pane>
				)
			}
		];
		return (
			<Tab panes={panes} />
		);
	}

}
