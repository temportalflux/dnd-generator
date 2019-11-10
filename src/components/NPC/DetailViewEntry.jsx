import React, { useState } from 'react';
import { Segment, Accordion, Icon, Header, Container } from 'semantic-ui-react';
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
	active, onClick
})
{
	const table = tableCollection ? tableCollection.getTable(tableKey) : null;
	const npcSchema = tableCollection ? tableCollection.getNpcSchema() : null;

	const categories = {};

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
			<Accordion.Title
				index={propertyKey}
				active={active}
				onClick={onClick}
			>
				<Icon name='dropdown' />
				{camelCaseToTitle(propertyKey)}
			</Accordion.Title>
			<Accordion.Content
				active={active}
			>
				<Segment basic>
					<StorageAccordion
						storageKey={storageKey}
						entries={categories}
					/>
				</Segment>
			</Accordion.Content>
		</div>
	);
}
