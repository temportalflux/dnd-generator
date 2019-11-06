import React, { useState } from 'react';
import { Segment, Accordion, Icon } from 'semantic-ui-react';
import storage from 'local-storage';
import { DISPLAY_MODES } from './EDisplayModes';
import { DataViewEntry } from './DetailViewEntry';

const EXPANDED_ENTRY_KEYS_STORAGE = `npc.${DISPLAY_MODES.Detailed}.expandedEntries`;

export function DetailView({ tableCollection })
{
	const [expandedEntryKeys, setExpandedEntryKeys_state] = useState(storage.get(EXPANDED_ENTRY_KEYS_STORAGE) || []);
	function setExpandedEntryKeys(keys)
	{
		if (keys.length > 0) storage.set(EXPANDED_ENTRY_KEYS_STORAGE, keys);
		else storage.remove(EXPANDED_ENTRY_KEYS_STORAGE);
		setExpandedEntryKeys_state(keys);
	}
	function addExpandedEntryKey(key) { setExpandedEntryKeys(expandedEntryKeys.concat([key])); }
	function removeExpandedEntryKey(key) { setExpandedEntryKeys(expandedEntryKeys.filter((item) => item !== key)); }
	function isEntryExpanded(key) { return expandedEntryKeys.includes(key); }

	const handleAccordionClick = (_, { index }) =>
	{
		if (!isEntryExpanded(index)) addExpandedEntryKey(index);
		else removeExpandedEntryKey(index);
	};

	const npcSchema = tableCollection.getNpcSchema();
	console.log(tableCollection.getNpcSchema());

	return (
		<Accordion>

			{npcSchema.getCategories().map((category) => (
				<DataViewEntry key={category}
					tableCollection={tableCollection}
					propertyKey={category}
					active={isEntryExpanded(category)}
					onClick={handleAccordionClick}
				/>
			))}
			
		</Accordion>
	);
}
