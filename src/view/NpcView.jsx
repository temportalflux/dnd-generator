import React, { useState, useEffect } from 'react';
import TableCollection from '../storage/TableCollection';
import { Loader, Icon } from 'semantic-ui-react';
import shortid from 'shortid';
import { DetailView } from '../components/NPC/DetailView';
import storage from 'local-storage';
import {
	DISPLAY_MODES,
	getNextDisplayMode,
} from '../components/NPC/EDisplayModes';
import NpcData from '../storage/NpcData';
import { ArticleView } from '../components/NPC/ArticleView';

const CURRENT_DISPLAYMODE_STORAGE = `npc.displayMode`;

export function NpcView(props)
{
	const parsedNpcData = NpcData.getCurrentLinkData();
	if (parsedNpcData !== undefined)
	{
		// filter out the npc data
		// warning: this will remove ALL url params
		window.location.replace(
			`${window.location.protocol}//${window.location.host}${window.location.pathname}`
		);
	}

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

	useEffect(() =>
	{
		function onNpcInitialized({ detail })
		{
			refreshWith(shortid.generate());
		};
		NpcData.toggleOnInitialized('on', onNpcInitialized);
		if (!NpcData.get())
		{
			NpcData.initialize((npc) => {
				if (parsedNpcData !== undefined)
				{
					npc.setState(parsedNpcData);
				}
				npc.regenerateAll(NpcData.getState() || {});
			});
		}
		return () =>
		{
			NpcData.toggleOnInitialized('off', onNpcInitialized);
		}
	});

	const tableCollection = TableCollection.get();
	const npcData = NpcData.get();
	if (!tableCollection || !npcData)
	{
		return (
			<Loader active>Loading</Loader>
		);
	}

	switch (displayMode)
	{
		case DISPLAY_MODES.Readable: return (
			<ArticleView
				location={props.location}
				tableCollection={tableCollection}
				switchDisplayMode={switchDisplayMode}
				displayMode={displayMode}
			/>
		);
		case DISPLAY_MODES.Detailed: return (
			<DetailView
				location={props.location}
				tableCollection={tableCollection}
				switchDisplayMode={switchDisplayMode}
				displayMode={displayMode}
			/>
		);
		default: return (
			<div>
				Something went wrong, I'm confused... <Icon name='question' />
			</div>
		);
	}
}
