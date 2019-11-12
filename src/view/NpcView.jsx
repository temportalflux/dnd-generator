import React, { useState, useEffect } from 'react';
import { ViewContainer } from './ViewContainer';
import TableCollection from '../storage/TableCollection';
import { Loader, Header, Button, Icon, Popup, Menu } from 'semantic-ui-react';
import shortid from 'shortid';
import { DetailView } from '../components/NPC/DetailView';
import storage from 'local-storage';
import {
	DISPLAY_MODES,
	getDisplayIconForMode,
	getNextDisplayMode,
	getDisplayModeSwitchLabel,
} from '../components/NPC/EDisplayModes';
import NpcData from '../storage/NpcData';

//import {Npc} from './pages/Npc';
// <Npc/>

const CURRENT_DISPLAYMODE_STORAGE = `npc.displayMode`;

export function NpcView(props)
{
	const refreshWith = useState(0)[1];
	const [displayMode, setDisplayMode] = useState(storage.get(CURRENT_DISPLAYMODE_STORAGE) || DISPLAY_MODES.Readable);
	const switchDisplayMode = () => {
		const nextMode = getNextDisplayMode(displayMode);
		storage.set(CURRENT_DISPLAYMODE_STORAGE, nextMode);
		setDisplayMode(nextMode);
	};

	useEffect(() =>
	{
		function onTableCollectionChanged({ detail })
		{
			refreshWith(shortid.generate());
		};
		TableCollection.addOnChanged(onTableCollectionChanged);
		return () =>
		{
			TableCollection.removeOnChanged(onTableCollectionChanged);
		}
	});

	const tableCollection = TableCollection.get();
	if (!tableCollection)
	{
		return (
			<ViewContainer page={props.location.pathname}>
				<Loader active>Loading</Loader>
			</ViewContainer>
		);
	}

	NpcData.initialize();

	const renderDisplayMode = () => {
		switch (displayMode)
		{
			case DISPLAY_MODES.Readable: return (
				'TODO'
			);
			case DISPLAY_MODES.Detailed: return (
				<DetailView tableCollection={tableCollection} />
			);
			default: return (
				<div>
					Something went wrong, I'm confused... <Icon name='question' />
				</div>
			);
		}
	}

	return (
		<ViewContainer page={props.location.pathname}>
			
			<Menu borderless pointing secondary>
				<Menu.Item>
					<Header>
						<Icon name={getDisplayIconForMode(displayMode)} />
						<Header.Content>NPC</Header.Content>
					</Header>
				</Menu.Item>
				<Menu.Menu position='right'>
					<Menu.Item>
						<Popup
							position='bottom right'
							content={getDisplayModeSwitchLabel(displayMode)}
							trigger={(
								<Button
									icon={getDisplayIconForMode(getNextDisplayMode(displayMode))}
									onClick={switchDisplayMode}
									style={{ marginLeft: 2, marginRight: 2, }}
								/>
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

			{renderDisplayMode()}
			
		</ViewContainer>
	);
}
