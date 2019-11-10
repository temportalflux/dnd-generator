import React from 'react';
import { camelCaseToTitle } from '../../lib/str';
import { StorageAccordion } from '../StorageAccordion';
import { DISPLAY_MODES } from './EDisplayModes';
import { Accordion, Icon, Segment } from 'semantic-ui-react';
import { DataViewEntry } from './DetailViewEntry';

function DetailViewCategory({
	propertyKey, tableCollection, categoryFields, storageKey,
	active, onClick
})
{
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
						entryComponentType={DataViewEntry}
						entries={categoryFields.reduce((accum, fieldKey) =>
						{
							accum[fieldKey] = {
								propertyKey: fieldKey,
								tableCollection: tableCollection,
								tableKey: fieldKey,
								storageKey: `${storageKey}.${fieldKey}`,
							};
							return accum;
						}, {})}
					/>
				</Segment>
			</Accordion.Content>
		</div>
	);
}

export function DetailView({ tableCollection, npc })
{
	const npcSchema = tableCollection.getNpcSchema();
	const storageKey = `npc.${DISPLAY_MODES.Detailed}.expandedEntries`;
	console.log(tableCollection, npcSchema, npc);
	return (
		<StorageAccordion
			storageKey={storageKey}
			entryComponentType={DetailViewCategory}
			entries={npcSchema.getCategories().reduce((accum, category) =>
			{
				accum[category] = {
					propertyKey: category,
					tableCollection: tableCollection,
					categoryFields: tableCollection.getNpcSchema().getFieldsForCategory(category),
					storageKey: `${storageKey}.${category}`,
				};
				return accum;
			}, {})}
		/>
	);
}
