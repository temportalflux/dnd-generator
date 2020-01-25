import React from 'react';
import { Menu, Button, Icon, Header } from 'semantic-ui-react';
import { HeaderBarLink } from './HeaderBarLink';
import TableCollection from '../storage/TableCollection';
import packageJson from '../../package.json';

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

				<Header style={{width: '100%', textAlign: 'center'}}>
					D&D Generator
					<Header.Subheader>{packageJson.versionPrefix} v{packageJson.version}</Header.Subheader>
				</Header>

				<Menu.Item position='right'>
					<Button color='red' onClick={this.onClearStorage.bind(this)}>
						<Icon name='sync' /> Sync
					</Button>
				</Menu.Item>
      </Menu>
		);
	}
}