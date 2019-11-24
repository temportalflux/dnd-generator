import React, { useState, useEffect } from 'react';
import { ViewContainer } from './ViewContainer';
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
import * as queryString from 'query-string';

const CURRENT_DISPLAYMODE_STORAGE = `npc.displayMode`;

export function NpcView(props)
{
	const parsedNpcData = (() => {
		const npcDataInUrl = queryString.parse(props.location.search);
		if (typeof npcDataInUrl.npc === 'string') 
		{
			return JSON.parse(npcDataInUrl.npc);
		}
		return undefined;
	})();

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
			NpcData.initialize(parsedNpcData);
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
			<ViewContainer page={props.location.pathname}>
				<Loader active>Loading</Loader>
			</ViewContainer>
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
