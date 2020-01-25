import React from 'react';
import { Accordion, Icon } from 'semantic-ui-react';
import { camelCaseToTitle } from '../../lib/str';
import { StorageAccordion } from '../StorageAccordion';
import { DISPLAY_MODES } from './EDisplayModes';
import { DataViewEntry } from './DetailViewEntry';
import NpcData from '../../storage/NpcData';
import { MenuBar } from './MenuBar';

function DetailViewCategory({
	propertyKey, tableCollection,
	categoryFields, storageKey,
	active, onClick,
})
{
	return (
		<div>
			<Accordion.Title
				index={propertyKey}
				active={active}
				onClick={onClick}
				style={{ marginBottom: 0 }}
			>
				<Icon name='dropdown' />
				{camelCaseToTitle(propertyKey)}
			</Accordion.Title>
			<Accordion.Content
				active={active}
			>
				<div style={{
					paddingLeft: '1em'
				}}>
					<StorageAccordion
						storageKey={storageKey}
						entryComponentType={DataViewEntry}
						active={active}
						entries={categoryFields.reduce((accum, fieldKey) =>
						{
							accum[fieldKey] = {
								propertyKey: fieldKey,
								tableCollection: tableCollection,
								entryKey: `${propertyKey}.${fieldKey}`,
								storageKey: `${storageKey}.${fieldKey}`,
							};
							return accum;
						}, {})}
					/>
				</div>
			</Accordion.Content>
		</div>
	);
}

export function DetailView(props)
{
	const npcSchema = props.tableCollection.getNpcSchema();
	const storageKey = `npc.${DISPLAY_MODES.Detailed}.expandedEntries`;
	const npc = NpcData.get();
	return (
		<div>
			<MenuBar
				switchDisplayMode={props.switchDisplayMode}
				displayMode={props.displayMode}
			/>

			<StorageAccordion
				storageKey={storageKey}
				entryComponentType={DetailViewCategory}
				entries={npc.getCategories().reduce((accum, category) =>
				{
					accum[category] = {
						propertyKey: category,
						tableCollection: props.tableCollection,
						categoryFields: npc.getEntriesForCategory(category),
						storageKey: `${storageKey}.${category}`,
					};
					return accum;
				}, {})}
			/>
		</div>
	);
}
