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
		entry.addListenerOnModified(onChanged);
		entry.addListenerOnUpdateCollection(onChanged);
		return () => {
			entry.removeListenerOnChanged(onChanged)
			entry.removeListenerOnUpdateString(onChanged);
			entry.removeListenerOnModified(onChanged);
			entry.removeListenerOnUpdateCollection(onChanged);
		};
	});

	const rawValue = entry.getRawValue();
	const modifiedValue = entry.getModifiedValue();
	const hasFilter = entry.hasFilter(tableCollection);
	const modifiersFromEntry = entry.getModifyingEntryData();
	const modifiersFromEntryCount = entry.getModifyingEntryKeys().length;
	const hasModifiers = modifiersFromEntryCount > 0;
	const modifiersOfEntry = entry.getModifiedByEntryKeys();
	const isModified = Object.keys(modifiersOfEntry).length > 0;
	const stringifyDeps = entry.getStringifyDependencies();
	const stringifySubscribed = entry.stringifyLinker.getSubscribedKeys();
	const generationDependencies = entry.getGenerationDependencies();
	const generationDependedOnBy = entry.generationDependencyLinker.getSubscribedKeys();
	const canRegenerate = entry.getCanReroll();
	const collectionEntryKeys = entry.getCollectionEntryKeys();
	const collectionEntryObj = collectionEntryKeys.reduce((accum, entryKey) => {
		const collectionEntry = npc.getEntry(entryKey);
		if (collectionEntry && !collectionEntry.isValueEquivalentToNone())
			accum[entryKey] = collectionEntry.toString();
		return accum;
	}, {})

	if (active)
	{
		//console.log(entry, collectionEntryKeys);
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
				{!isMissingSourceTable && canRegenerate && <Menu.Item fitted position='right'>
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
						<Form.Group widths={'equal'} style={hasFilter && !entry.hasValue() ? {margin: 0} : {}}>
							{hasFilter && (
								<Form.Field
									label={'Filter'}
									control={TableFilter}
									tableCollection={tableCollection}
									tableKey={sourceTableKey !== undefined ? inlineEval(sourceTableKey, npcModifiedData) : undefined}
									storageKey={entry.getKeyPath()}
								/>
							)}
							{entry.hasValue() && <Form.Field>
								<label>Generated Value</label>
								{rawValue !== undefined ? rawValue : (
									<span style={{ color: 'red' }}>Not Generated</span>
								)}
							</Form.Field>}
							{entry.hasValue() && <Form.Field>
								<label>Value with Modifiers</label>
								{modifiedValue !== undefined ? modifiedValue : (
									<span style={{ color: 'red' }}>Not Generated</span>
								)}
							</Form.Field>}
						</Form.Group>
						<Form.Group widths={'equal'} style={
							!(
								hasModifiers
								|| isModified
								|| stringifyDeps.length > 0
								|| stringifySubscribed.length > 0
								|| generationDependencies.length > 0
								|| generationDependedOnBy.length > 0
							) ? {margin: 0} : {}
						}>
							{hasModifiers && <Form.Field>{makeModifierPopup(
								'Modifies', 'Modifies Entries', modifiersFromEntry
							)}</Form.Field>}
							{isModified && <Form.Field>{makeModifierPopup(
								'Modified By', 'Modified by Entries', modifiersOfEntry
							)}</Form.Field>}
							{stringifyDeps.length > 0 && <Form.Field>{makeModifierPopup(
								'String Dependencies', 'String Dependencies', stringifyDeps
							)}</Form.Field>}
							{stringifySubscribed.length > 0 && <Form.Field>{makeModifierPopup(
								'String Subscriptions', 'String Subscriptions', stringifySubscribed
							)}</Form.Field>}
							{generationDependencies.length > 0 && <Form.Field>{makeModifierPopup(
								'Dependencies', 'Generation Dependencies', generationDependencies
							)}</Form.Field>}
							{generationDependedOnBy.length > 0 && <Form.Field>{makeModifierPopup(
								'Depended On By', 'Generations That Depend on entry', generationDependedOnBy
							)}</Form.Field>}
							{collectionEntryKeys.length > 0 && <Form.Field>
								{makeModifierPopup('Other Values', 'Collective Values', collectionEntryObj)}
								{lodash.toPairs(collectionEntryObj).map(([entryKey, stringified]) => (
									<Popup key={entryKey}
										trigger={(<p>{stringified}</p>)}
										content={(`Source: ${entryKey}`)}
									/>
								))}
							</Form.Field>}
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
