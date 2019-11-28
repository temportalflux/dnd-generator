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
				<HeaderBarLink path={'home'}>Home</HeaderBarLink>
				<HeaderBarLink path={'npc'}>NPC</HeaderBarLink>
				<HeaderBarLink path={'data'}>Data</HeaderBarLink>

				<Menu.Item position='right'>
					<Button color='red' onClick={this.onClearStorage.bind(this)}>
						<Icon name='sync' /> Sync
					</Button>
				</Menu.Item>
      </Menu>
		);
	}
}