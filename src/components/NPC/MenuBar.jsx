import React from 'react';
import { Header, Button, Icon, Popup, Menu, Dropdown } from 'semantic-ui-react';
import {
	getDisplayIconForMode,
	getDisplayModeSwitchLabel,
} from './EDisplayModes';
import NpcData from '../../storage/NpcData';
import copyToClipboard from '../../lib/clipboard';
import Filter from '../../storage/Filter';
import { renderToString } from 'react-dom/server';
import { ArticleContent } from './ArticleContent';

export function MenuBar({
	switchDisplayMode,
	displayMode,
	menuItemsRight,
	getEntryLink,
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
				<Dropdown key='export' item text={'Copy To Clipboard'}>
					<Dropdown.Menu>
						<Dropdown.Item icon='linkify' text='Generator Link' onClick={() => copyToClipboard(NpcData.getLink())} />
						<Dropdown.Item icon='file text' text='Article' onClick={() => {
							copyToClipboard(renderToString(
								<ArticleContent usePlainText={true} />
							));
						}} />
						<Dropdown.Item icon='code' text='JSON' onClick={() => copyToClipboard(JSON.stringify(NpcData.getState()))} />
					</Dropdown.Menu>
				</Dropdown>
				<Menu.Item>
					<Popup
						position='bottom right'
						content={'Clear All Filters'}
						trigger={(
							<Button
								icon
								onClick={Filter.clear}
								style={{ marginLeft: 2, marginRight: 2, }}
							>
								<Icon.Group>
									<Icon name='filter' />
									<Icon name='cancel' corner='bottom right' />
								</Icon.Group>
							</Button>
						)}
					/>
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