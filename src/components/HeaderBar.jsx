import React from 'react';
import { Menu, Button, Icon } from 'semantic-ui-react';
import { HeaderBarLink } from './HeaderBarLink';
import TableCollection from '../storage/TableCollection';

export class HeaderBar extends React.Component
{

	onClearStorage()
	{
		console.log('Syncing tables');
		TableCollection.clear();
	}

	render()
	{
		return (
			<Menu>
				<HeaderBarLink name={'home'} path={'/'} activeItem={this.props.page}>Home</HeaderBarLink>
				<HeaderBarLink name={'npc'} path={'/npc'} activeItem={this.props.page}>NPC</HeaderBarLink>
				<HeaderBarLink name={'data'} path={'/data'} activeItem={this.props.page}>Data</HeaderBarLink>

				<Menu.Item position='right'>
					<Button color='red' onClick={this.onClearStorage.bind(this)}>
						<Icon name='sync' /> Sync
					</Button>
				</Menu.Item>
      </Menu>
		);
	}
}