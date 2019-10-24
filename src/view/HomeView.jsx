import React from 'react';
import { ViewContainer } from './ViewContainer';
import { Header } from 'semantic-ui-react';

export class HomeView extends React.Component
{
	render()
	{
		return (
			<ViewContainer page={this.props.location.pathname}>
				<Header>HOME</Header>
			</ViewContainer>
		);
	}
}