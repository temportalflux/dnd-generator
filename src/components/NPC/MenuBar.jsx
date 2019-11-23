import React from 'react';
import { Header, Button, Icon, Popup, Menu } from 'semantic-ui-react';
import {
	getDisplayIconForMode,
	getDisplayModeSwitchLabel,
} from './EDisplayModes';
import NpcData from '../../storage/NpcData';

export function MenuBar({
	switchDisplayMode,
	displayMode,
	menuItemsRight,
})
{
	// TODO: Figure out how to keep the switch view mode popup open when the item is clicked
	return (
		<Menu borderless pointing secondary>
			<Menu.Item onClick={switchDisplayMode}>
				<Popup
					position='bottom right'
					content={'Switch view mode'/*getDisplayModeSwitchLabel(displayMode)*/}
					trigger={(
						<Header>
							<Icon name={getDisplayIconForMode(displayMode)} />
							<Header.Content>NPC</Header.Content>
						</Header>
					)}
				/>
			</Menu.Item>
			<Menu.Menu position='right'>
				{menuItemsRight || []}
				<Menu.Item>
					<Popup
						position='bottom right'
						content={'Delete generated data'}
						trigger={(
							<Button
								icon={'trash'}
								onClick={NpcData.clear}
								style={{ marginLeft: 2, marginRight: 2, }}
							/>
						)}
					/>
				</Menu.Item>
			</Menu.Menu>
		</Menu>
	);
}