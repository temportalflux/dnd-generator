import React from 'react';
import { ViewContainer } from './ViewContainer';
import DataStorage from '../storage/DataStorage';

export class DataView extends React.Component
{
	render()
	{
		return (
			<ViewContainer page={this.props.location.pathname}>
				This is the data page
			</ViewContainer>
		);
	}
}