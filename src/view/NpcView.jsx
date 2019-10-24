import React from 'react';
import { ViewContainer } from './ViewContainer';

//import {Npc} from './pages/Npc';
// <Npc/>

export class NpcView extends React.Component
{
	render()
	{
		return (
			<ViewContainer page={this.props.location.pathname}>
				This is the npc page
			</ViewContainer>
		);
	}
}
