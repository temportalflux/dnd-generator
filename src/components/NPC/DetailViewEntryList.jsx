import React from 'react';
import { DISPLAY_MODES } from './EDisplayModes';
import { DataViewEntry } from './DetailViewEntry';
import { StorageAccordion } from '../StorageAccordion';

const EXPANDED_ENTRY_KEYS_STORAGE = `npc.${DISPLAY_MODES.Detailed}.expandedEntries`;

export function DetailViewEntryList({
	parentPropertyKey,
	tableCollection, childTableKeys,
	getCategoryFields,
	entryComponentType,
})
{
	if (!childTableKeys || childTableKeys.legnth === 0) return <div />;
	const storageKey = parentPropertyKey ? `${EXPANDED_ENTRY_KEYS_STORAGE}.${parentPropertyKey}` : EXPANDED_ENTRY_KEYS_STORAGE;
	const hasCategories = getCategoryFields && typeof getCategoryFields === 'function';
	return (
		<StorageAccordion
			storageKey={storageKey}
			entryComponentType={entryComponentType || DataViewEntry}
			entries={childTableKeys.reduce((accum, childTableKey) =>
			{
				accum[childTableKey] = {
					propertyKey: childTableKey,
					tableCollection: tableCollection,
					entryKey: hasCategories ? undefined : `${parentPropertyKey}/${childTableKey}`,
					categoryFields: hasCategories ? getCategoryFields(tableCollection, childTableKey) : undefined,
					storageKey: storageKey,
				};
				return accum;
			}, {})}
		/>
	);
}
