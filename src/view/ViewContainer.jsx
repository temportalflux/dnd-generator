import React from 'react';
import { HeaderBar } from '../components/HeaderBar';
import { Container } from 'semantic-ui-react';

export class ViewContainer extends React.Component
{
	render()
	{
		return (
			<Container>
				<HeaderBar page={this.props.page} />
				{ this.props.children }
			</Container>
		);
	}
}
