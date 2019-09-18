import React from 'react'
import { Grid } from 'semantic-ui-react';
import FilterMenu from '../components/FilterMenu';
import DisplayNpc from '../components/DisplayNpc';
import { generate } from '../generator/index';

export default class Home extends React.Component
{

	constructor(props)
	{
		super(props);
		this.generate = this.generate.bind(this);
		this.state = {
			npc: undefined
		};
	}

	generate(filter)
	{
		this.setState({
			npc: generate(filter)
		});
	}

	render()
	{
		return (
			<Grid columns={2}>
				<Grid.Row>
					<Grid.Column>
						<FilterMenu
							generate={this.generate}
						/>
					</Grid.Column>
					<Grid.Column>
						<DisplayNpc
							data={this.state.npc}
						/>
					</Grid.Column>
				</Grid.Row>
			</Grid>
		);
	}

}
