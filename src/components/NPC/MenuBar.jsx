import React from 'react';
import { Header, Button, Icon, Popup, Menu, Dropdown } from 'semantic-ui-react';
import {
	getDisplayIconForMode,
	getDisplayModeSwitchLabel,
	getNextDisplayMode,
} from './EDisplayModes';
import NpcData from '../../storage/NpcData';
import TableCollection from '../../storage/TableCollection';
import copyToClipboard from '../../lib/clipboard';
import Filter from '../../storage/Filter';
import { renderToString } from 'react-dom/server';
import { ArticleContent } from './ArticleContent';

export function MenuBar({
	switchDisplayMode,
	displayMode,
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
							<Header.Content>NPC ({displayMode})</Header.Content>
						</Header>
					)}
				/>
			</Menu.Item>
			
			<Menu.Menu position='right'>
				<Dropdown key='actions' item text='Actions'>
					<Dropdown.Menu>

						<Dropdown.Header content='Control' />
						<Dropdown.Item
							icon={getDisplayIconForMode(getNextDisplayMode(displayMode))}
							text={getDisplayModeSwitchLabel(displayMode)}
							onClick={switchDisplayMode}
						/>
						<Dropdown.Item icon='repeat' text='Reroll NPC' onClick={NpcData.clear} />
						<Dropdown.Item icon='filter' text='Clear All Filters' onClick={Filter.clear} />

						<Dropdown.Divider />

						<Dropdown.Header content='Copy to Clipboard' />
						<Dropdown.Item icon='linkify' text='Generator Link' onClick={() => copyToClipboard(NpcData.getLink())} />
						<Dropdown.Item icon='file text' text='Article' onClick={() => {
							copyToClipboard(renderToString(
								<ArticleContent usePlainText={true} />
							));
						}} />
						<Dropdown.Item icon='code' text='JSON' onClick={() => copyToClipboard(JSON.stringify(NpcData.getState()))} />
						
						<Dropdown.Divider />

						<Dropdown.Header content='Danger Zone' />
						<Dropdown.Item icon='trash' text='Clear All Local Data' onClick={() => {
							Filter.clear();
							TableCollection.clear();
							NpcData.clear();
						}} />

					</Dropdown.Menu>
				</Dropdown>
				<Menu.Item>
					<Button
						icon='repeat'
						content='Reroll'
						color='blue'
						onClick={NpcData.clear}
						style={{ marginLeft: 2, marginRight: 2, }}
					/>
				</Menu.Item>
			</Menu.Menu>
		</Menu>
	);
}