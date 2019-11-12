import React, { useState } from 'react';
import storage from 'local-storage';
import lodash from 'lodash';
import { Accordion } from 'semantic-ui-react';

export function StorageAccordion({
	storageKey,
	entryComponentType,
	entries,
})
{
	const [expandedEntryKeys, setExpandedEntryKeys_state] = useState(storage.get(storageKey) || []);
	function setExpandedEntryKeys(keys)
	{
		if (keys.length > 0) storage.set(storageKey, keys);
		else storage.remove(storageKey);
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

	return (
		<Accordion style={{ margin: 0 }}>
			{lodash.toPairs(entries).map(([entryKey, entryProps]) => (
				React.createElement(entryProps.storageAccordianComponent || entryComponentType, {
					...entryProps,
					key: entryKey,
					active: isEntryExpanded(entryKey),
					onClick: handleAccordionClick,
				})
			))}
		</Accordion>
	);
}
