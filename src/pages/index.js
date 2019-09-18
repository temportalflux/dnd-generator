import React from 'react'
import {Grid} from 'semantic-ui-react';
import FilterMenu from '../components/FilterMenu';
import DisplayNpc from '../components/DisplayNpc';
import {generate} from '../generator/index';

export default class Home extends React.Component
{

	constructor(props)
	{
		super(props);
		this.generate = this.generate.bind(this);
	}

	generate(filter)
	{
		console.log(generate(filter));
	}

	render()
	{
		return (
			<Grid columns={1}>
				<Grid.Row>
					<Grid.Column>
						<FilterMenu
							generate={this.generate}
						/>
					</Grid.Column>
						<DisplayNpc/>
				</Grid.Row>
			</Grid>
		);
	}

}
