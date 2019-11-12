import React from 'react';
import { camelCaseToTitle } from '../../lib/str';
import { StorageAccordion } from '../StorageAccordion';
import { DISPLAY_MODES } from './EDisplayModes';
import { Accordion, Icon, Segment, Header } from 'semantic-ui-react';
import { DataViewEntry } from './DetailViewEntry';
import NpcData from '../../storage/NpcData';

function DetailViewCategory({
	propertyKey, tableCollection,
	categoryFields, storageKey,
	active, onClick,
})
{
	return (
		<div style={{marginBottom: '1rem'}}>
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
						entries={categoryFields.reduce((accum, fieldKey) =>
						{
							accum[fieldKey] = {
								propertyKey: fieldKey,
								tableCollection: tableCollection,
								tableKey: `${propertyKey}.${fieldKey}`,
								storageKey: `${storageKey}.${fieldKey}`,
								depth: 1,
							};
							return accum;
						}, {})}
					/>
				</div>
			</Accordion.Content>
		</div>
	);
}

export function DetailView({ tableCollection })
{
	const npcSchema = tableCollection.getNpcSchema();
	const storageKey = `npc.${DISPLAY_MODES.Detailed}.expandedEntries`;
	console.log(tableCollection, npcSchema, NpcData.get());
	const npc = NpcData.get();
	return (
		<StorageAccordion
			storageKey={storageKey}
			entryComponentType={DetailViewCategory}
			entries={npc.getCategories().reduce((accum, category) =>
			{
				accum[category] = {
					propertyKey: category,
					tableCollection: tableCollection,
					categoryFields: npc.getEntriesForCategory(category),
					storageKey: `${storageKey}.${category}`,
				};
				return accum;
			}, {})}
		/>
	);
}
