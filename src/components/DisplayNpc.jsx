import React from 'react';
import { Segment } from 'semantic-ui-react';

export default class DisplayNpc extends React.Component
{
	render()
	{
		const { data } = this.props;
		return (
			<Segment>
				<pre>{JSON.stringify(data, null, 2)}</pre>
			</Segment>
		);
	}
}