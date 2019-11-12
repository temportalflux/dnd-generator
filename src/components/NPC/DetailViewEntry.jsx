import React, { useState } from 'react';
import { Segment, Accordion, Icon, Header, Container, Popup, Button, Menu } from 'semantic-ui-react';
import { TableFilter } from '../TableFilter';
import { DetailViewEntryList } from './DetailViewEntryList';
import { StorageAccordion } from '../StorageAccordion';
import { camelCaseToTitle } from '../../lib/str';
import NpcData from '../../storage/NpcData';

function DataViewEntryCategory({
	titleKey, description, children,
	active, onClick
})
{
	return (
		<div>
			<Accordion.Title
				index={titleKey}
				active={active}
				onClick={onClick}
			>
				{camelCaseToTitle(titleKey)} <Icon name='dropdown' />
			</Accordion.Title>
			<Accordion.Content active={active}>
				{description}
				{children}
			</Accordion.Content>
		</div>
	);
}

export function DataViewEntry({
	propertyKey, tableCollection, categoryFields, tableKey, storageKey,
	active, onClick,
	depth,
})
{
	const table = tableCollection ? tableCollection.getTable(tableKey) : null;
	const npcSchema = tableCollection ? tableCollection.getNpcSchema() : null;

	const categories = {};
	const npc = NpcData.get();
	const entry = npc.getEntry(tableKey);
	//console.log(entry, entry.getField(npcSchema));

	/*
	if (childTableKeys.length > 0)
	{
		categories['children'] = {
			storageAccordianComponent: DataViewEntryCategory,
			titleKey: 'children',
			description: 'These are the child fields for this item',
			children: [
				(
					<DetailViewEntryList
						key={0}
						parentPropertyKey={propertyKey}
						tableCollection={tableCollection}
						childTableKeys={childTableKeys}
					/>
				)
			]
		};
	}
	//*/

	return (
		<div>
			<Menu secondary style={{ marginBottom: 0 }}>
				<Menu.Item fitted>
					<Accordion.Title
						index={propertyKey}
						active={active}
						onClick={onClick}
					>
						<Icon name='dropdown' />
						{camelCaseToTitle(propertyKey)}
					</Accordion.Title>
				</Menu.Item>
				<Menu.Item fitted position='right'>
					<Button
						icon={'refresh'}
						onClick={() => entry.regenerate(npcSchema)}
					/>
				</Menu.Item>
			</Menu>
			{active && <Accordion.Content
				active={active}
			>
				<div style={{
					borderLeft: '2px solid rgba(34,36,38,.15)',
					paddingLeft: '10px',
					marginLeft: '7px',
				}}>
					Test
					<StorageAccordion
						storageKey={storageKey}
						entries={categories}
					/>
				</div>
			</Accordion.Content>}
		</div>
	);
}
