 /*eslint no-unused-vars: [0, {"args": "after-used", "argsIgnorePattern": "^_"}]*/

import React, { useEffect } from 'react';
import { Accordion, Icon, Button, Menu, Form, Popup, Header } from 'semantic-ui-react';
import { TableFilter } from '../TableFilter';
import { StorageAccordion } from '../StorageAccordion';
import { camelCaseToTitle } from '../../lib/str';
import NpcData from '../../storage/NpcData';
import * as shortid from 'shortid';
import { inlineEval } from '../../generator/modules/evalAtCtx';
import lodash from 'lodash';

/*
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
//*/

function makeModifierPopup(title, popupTitle, itemMap)
{
	return (
		<Popup
			trigger={<label>{title} ({Object.keys(itemMap).length})</label>}
			content={(
				<div>
					<Header as='h5'>{popupTitle}</Header>
					{Object.keys(itemMap).map((key) => (
						<div key={key}>
							{key}: {JSON.stringify(itemMap[key])}
						</div>
					))}
				</div>
			)}
		/>
	);
}

function EntryView({
	tableCollection, npcSchema, npc,
	propertyKey, storageKey,
	entry, parentEntry,
	active, onClick, // from StorageAccordion
})
{
	// TODO: this is ineffecient, but it cant be passed in b/c passing through react copies objects, does not pass by ref.
	// maybe add functionality to cache data until it is marked as dirty.
	const npcModifiedData = npc.getModifiedData();
	const sourceTableKey = parentEntry.getSourceTableKey(tableCollection);
	const isMissingSourceTable = parentEntry.isMissingSourceTable(tableCollection, (k) => inlineEval(k, npcModifiedData));

	const refresh = React.useState(undefined)[1];
	useEffect(() => {
		function onChanged({ details }) { refresh(shortid.generate()); }
		entry.addListenerOnChanged(onChanged);
		entry.addListenerOnUpdateString(onChanged);
		return () => {
			entry.removeListenerOnChanged(onChanged)
			entry.removeListenerOnUpdateString(onChanged);
		};
	});

	const modifiersFromEntry = entry.getModifiers();
	const modifiersFromEntryCount = Object.keys(modifiersFromEntry).length;
	const hasModifiers = modifiersFromEntryCount > 0;
	const modifiersOfEntry = {}; // TODO: collective modifiers of this entry
	const isModified = Object.keys(modifiersOfEntry).length > 0;
	const stringifyDeps = entry.getStringifyDependencies();
	const stringifySubscribed = entry.stringifyLinker.getSubscribedKeys();

	if (active)
	{
		//console.log(entry);
	}

	return (
		<div>
			<Menu secondary style={{ marginBottom: 0 }}>
				<Menu.Item fitted>
					<Accordion.Title
						index={propertyKey}
						active={!isMissingSourceTable && active}
						onClick={onClick}
					>
						{!isMissingSourceTable && <Icon name='dropdown' />}
						{camelCaseToTitle(propertyKey)}
						<span> - {entry.toString()}</span>
						{isMissingSourceTable && (
							<span> - No generator available</span>
						)}
					</Accordion.Title>
				</Menu.Item>
				{!isMissingSourceTable && <Menu.Item fitted position='right'>
					<Button
						icon={'refresh'}
						onClick={() => entry.regenerate(npcModifiedData)}
						content={camelCaseToTitle(propertyKey)}
					/>
				</Menu.Item>}
			</Menu>
			{!isMissingSourceTable && active && <Accordion.Content
			>
				<div style={{
					borderLeft: '2px solid rgba(34,36,38,.15)',
					paddingLeft: '10px',
					marginLeft: '7px',
				}}>
					<Form>
						<Form.Group widths={'equal'}>
							{sourceTableKey !== undefined && (
								<Form.Field
									label={'Filter'}
									control={TableFilter}
									tableCollection={tableCollection}
									tableKey={inlineEval(sourceTableKey, npcModifiedData)}
									storageKey={entry.getKeyPath()}
								/>
							)}
							<Form.Field>
								<label>Generated Value</label>
								{entry.getRawValue() ? entry.toString() : (
									<span style={{ color: 'red' }}>Not Generated</span>
								)}
							</Form.Field>
							<Form.Field>
								<label>Value with Modifiers</label>
								<span style={{ color: 'red' }}>Not Generated</span>
							</Form.Field>
							<Form.Field>
								{hasModifiers && makeModifierPopup('Modifiers', 'Modifing Entries', modifiersFromEntry)}
								{isModified && makeModifierPopup('Modified By', 'Modified by Entries', modifiersOfEntry)}
								{stringifyDeps.length > 0 && makeModifierPopup('String Dependencies', 'String Dependencies', stringifyDeps)}
								{stringifySubscribed.length > 0 && makeModifierPopup('String Subscriptions', 'String Subscriptions', stringifySubscribed)}
							</Form.Field>
						</Form.Group>
					</Form>
					{entry.hasChildren() && <StorageAccordion
						storageKey={storageKey}
						entryComponentType={EntryView}
						entries={lodash.toPairs(entry.getChildren()).reduce((accum, [childKey, childEntry]) =>
						{
							accum[childKey] = {
								tableCollection: tableCollection,
								npcSchema: npcSchema,
								npc: npc,
								npcModifiedData: npcModifiedData,
								propertyKey: childKey,
								storageKey: `${storageKey}.${childKey}`,
								entry: childEntry,
								parentEntry: childEntry.schemaEntry,
							};
							return accum;
						}, {})}
					/>}
				</div>
			</Accordion.Content>}
		</div>
	);
}

export function DataViewEntry({
	propertyKey, tableCollection, entryKey, storageKey,
	active, onClick,
})
{
	const npcSchema = tableCollection ? tableCollection.getNpcSchema() : null;
	const npc = NpcData.get();
	const entry = npc.getEntry(entryKey);

	const parentEntry = entry.getField();

	return (
		<EntryView
			tableCollection={tableCollection} npcSchema={npcSchema} npc={npc}

			propertyKey={propertyKey} storageKey={storageKey}
			entry={entry} parentEntry={parentEntry}

			active={active} onClick={onClick}
		/>
	)
}
