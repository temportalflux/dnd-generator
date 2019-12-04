import Filter from './Filter';
import lodash from 'lodash';
import { createExecutor } from '../generator/modules/createExecutor';
import { inlineEval, PURE_VARIABLE_REGEX } from '../generator/modules/evalAtCtx';
import NpcData from './NpcData';

function objectEqualityDeepRecursive(a, b) {
	for(const key in a) {
			if(!(key in b) || !objectEqualityDeepRecursive(a[key], b[key])) {
					return false;
			}
	}
	for(var key in b) {
			if(!(key in a) || !objectEqualityDeepRecursive(a[key], b[key])) {
					return false;
			}
	}
	return true;
}

class EntryLinker
{

	constructor(owner, property, onEvent)
	{
		this.owner = owner;
		this.property = property;
		// entry keys that our owner has subscribed to
		this.subscribingTo = [];
		// entry keys that have subscribed to our owner
		this.subscribed = [];
		this.onEvent = onEvent;
	}

	getEntryForPath(entryPath)
	{
		return this.owner.npc.getEntry(entryPath);
	}

	subscribe(entryPaths)
	{
		this.subscribingTo = lodash.uniq(entryPaths);
		entryPaths.forEach((path) =>
		{
			const entry = this.getEntryForPath(path);
			if (entry) entry[this.property].add(this.owner);
		});
	}

	unsubscribe(entryPaths)
	{
		this.subscribingTo = this.subscribingTo.filter((key) => !entryPaths.includes(key));
		entryPaths.forEach((path) =>
		{
			const entry = this.getEntryForPath(path);
			if (entry) entry[this.property].remove(this.owner);
		});
	}

	add(entry)
	{
		this.subscribed.push(entry.getKeyPath());
		this.subscribed = lodash.uniq(this.subscribed);
	}

	remove(entry)
	{
		const entryKey = entry.getKeyPath();
		this.subscribed = this.subscribed.filter((key) => key !== entryKey);
	}

	getSubscribedKeys()
	{
		return this.subscribed;
	}

	dispatchToSubscriptions(evt, args, appendArgsForEntry=(a)=>a)
	{
		this.subscribingTo.forEach((entryPath) =>
		{
			const entry = this.getEntryForPath(entryPath);
			const linker = entry ? entry[this.property] : undefined;
			const onEvt = linker ? linker.onEvent : undefined;
			if (onEvt) onEvt(evt, appendArgsForEntry(args, entryPath));
		});
	}

	dispatchToSubscribers(evt, args)
	{
		this.subscribed.forEach((entryPath) =>
		{
			const entry = this.getEntryForPath(entryPath);
			const linker = entry ? entry[this.property] : undefined;
			const onEvt = linker ? linker.onEvent : undefined;
			if (onEvt) onEvt(evt, args);
		});
	}

}

export default class GeneratedEntry
{

	constructor(npcData)
	{
		this.npc = npcData;

		this.events = new EventTarget();
		this.schemaEntry = undefined;

		this.stringifyLinker = new EntryLinker(this, 'stringifyLinker', this.onStringifyLinkerEvent.bind(this));
		this.stringifyCached = undefined;

		this.generationDependencyLinker = new EntryLinker(this, 'generationDependencyLinker', this.onGenerationDependencyEvent.bind(this));
		this.modifyingLinker = new EntryLinker(this, 'modifyingLinker', this.onModifiersChanged.bind(this));
		this.collectionLinker = new EntryLinker(this, 'collectionLinker', this.onCollectionEntriesChanged.bind(this));
		
		this.modifierSources = {};
		this.totalModifyingValue = 0;
		this.forcedFilter = {};
		this.postOperationModifiers = {};

		this.category = undefined;
		this.key = undefined;

		this.generated = undefined;
		this.generatedChildren = undefined;
	}

	readEntry(entry)
	{
		this.schemaEntry = entry;
		this.key = entry.getKey();
	}

	getKeyPath()
	{
		if (this.key === undefined) return undefined;
		else if (this.category !== undefined) return `${this.category}.${this.key}`;
		else if (this.parent !== undefined) return `${this.parent.getKeyPath()}.${this.key}`;
		else return this.key;
	}

	getName()
	{
		const field = this.getField();
		if (field.name !== undefined) return field.name;
		const path = lodash.toPath(this.getKeyPath());
		return path[path.length - 1]
			.split(/(?=[A-Z])/)
			.map(
				(word) => `${word[0].toUpperCase()}${word.substr(1).toLowerCase()}`
			).join(' ');
	}

	getField()
	{
		return this.schemaEntry;
	}

	getGenerationMacro()
	{
		const field = this.getField();
		if (!field.hasSource()) return undefined;
		const macro = createExecutor(field.getSource());
		if (macro === undefined)
		{
			console.warn('Failed to find a valid exec source functor for field:', field);
		}
		return macro;
	}

	hasFilter(tableCollection, globalData)
	{
		const sourceTableKey = this.getField().getSourceTableKey(tableCollection);
		const table = sourceTableKey !== undefined ? tableCollection.getTable(inlineEval(sourceTableKey, globalData)) : undefined;
		return table ? table.hasFilter() : false;
	}

	getFilterValue()
	{
		const forcedFilter = Object.values(this.forcedFilter);
		return forcedFilter.length > 0 ? forcedFilter : Filter.get(this.getKeyPath());
	}

	getCanReroll()
	{
		return this.schemaEntry.getCanReroll() && (!this.parent || this.parent.getCanReroll());
	}

	clearLinking()
	{
		this.modifyingLinker.dispatchToSubscriptions('remove', {
			source: this.getKeyPath()
		}, (args, keyPath) => ({...args, value: this.getModifierFor(keyPath)}));
		this.modifyingLinker.unsubscribe(this.getModifyingEntryKeys());
		this.generationDependencyLinker.unsubscribe(this.getGenerationDependencies());
		this.stringifyLinker.unsubscribe(this.getStringifyDependencies());
		
		this.collectionLinker.dispatchToSubscriptions('remove', {
			source: this.getKeyPath()
		});
		this.collectionLinker.unsubscribe(this.getOurCollections());
	}

	regenerate(globalData, getPreset)
	{
		this.clearSaveState();

		if (this.generatedChildren)
		{
			lodash.values(this.generatedChildren).forEach((child) => child.clearLinking());
		}
		this.clearLinking();

		const presetData = typeof getPreset === 'function' ? getPreset(this) : undefined;

		let prevValueOrKey = undefined;
		if (this.generated !== undefined)
		{
			prevValueOrKey = this.generated.value;
			if (this.generated.entry !== undefined && this.generated.entry.hasKey())
			{
				prevValueOrKey = this.generated.entry.getKey();
			}
		}

		const filter = this.getFilterValue();
		if (filter !== undefined && filter.length === 1 && filter.includes(prevValueOrKey))
		{
			prevValueOrKey = undefined;
		}

		const context = {
			...globalData,
			filter: filter,
			ignore: prevValueOrKey !== undefined ? [prevValueOrKey] : undefined,
			preset: presetData,
		};
		this.generated = null;

		if (this.schemaEntry.value)
		{
			this.generated = {
				value: presetData !== undefined ? presetData : this.schemaEntry.value
			};
		}
		else
		{
			let redirectPath = [];
			do
			{
				let macro = undefined;
				// grab the redirector from the previous generated entry
				let redirector = this.generated && this.generated.entry && this.generated.entry.hasRedirector() ? this.generated.entry.getRedirector() : undefined;
				if (redirector !== undefined)
				{
					macro = createExecutor(`{roll:${redirector}}`);
				}
				else
				{
					macro = this.getGenerationMacro();
				}
				
				if (macro === undefined) break;
				
				this.generated = macro(redirector === undefined ? context : {...context, filter: undefined});
				if (this.generated && this.generated.entry && this.generated.entry.hasRedirector())
				{
					redirectPath.push(this.generated.entry.getKey());
				}
			} while (this.generated && this.generated.entry && this.generated.entry.hasRedirector());
			if (this.generated && redirectPath.length > 0)
			{
				this.generated.redirectPath = redirectPath;
			}
		}

		this.generatedChildren = this.generated && this.generated.entry && this.generated.entry.hasChildren()
			? lodash.mapValues(this.generated.entry.getChildren(), (child) =>
			{
				const clone = new GeneratedEntry(this.npc);
				clone.readEntry(child);
				clone.parent = this;
				return clone;
			}) : undefined;
		if (this.generatedChildren === undefined && this.schemaEntry && this.schemaEntry.hasChildren())
		{
			this.generatedChildren = lodash.mapValues(this.schemaEntry.getChildren(), (child) =>
			{
				const clone = new GeneratedEntry(this.npc);
				clone.readEntry(child);
				clone.parent = this;
				return clone;
			});
		}

		this.updateString(globalData);
		this.stringifyLinker.subscribe(this.getStringifyDependencies());

		// temporarily modify globalData until it can be accounted for later
		// we should probably just mark the data as dirty here instead of passing it through functions
		this.getModifiedData(globalData);
		this.writeSaveState();

		this.events.dispatchEvent(new CustomEvent('onChanged', { detail: {} }));

		this.collectionLinker.subscribe(this.getOurCollections());
		this.collectionLinker.dispatchToSubscriptions('add', {
			source: this.getKeyPath()
		});

		this.stringifyLinker.dispatchToSubscribers('onChanged', { globalData });

		this.generationDependencyLinker.subscribe(this.getGenerationDependencies());
		this.generationDependencyLinker.dispatchToSubscribers('onChanged', { key: this.getKeyPath(), globalData });

		this.modifyingLinker.subscribe(this.getModifyingEntryKeys());

		this.regenerateChildren(globalData, getPreset);

		this.modifyingLinker.dispatchToSubscriptions('add', {
			source: this.getKeyPath()
		}, (args, keyPath) => ({...args, value: this.getModifierFor(keyPath)}));

		if (this.parent) this.parent.onChildGenerated(this);
	}

	regenerateChildren(globalData, getPreset=undefined)
	{
		if (this.generatedChildren)
		{
			lodash.values(this.generatedChildren).forEach((child) => child.regenerate(globalData, getPreset));
		}
	}

	onChildGenerated(child)
	{
		this.modifyingLinker.dispatchToSubscriptions('remove', {
			source: this.getKeyPath()
		}, (args, keyPath) => ({...args, value: this.getModifierFor(keyPath)}));
		this.events.dispatchEvent(new CustomEvent('onChanged', { detail: {} }));
		this.modifyingLinker.dispatchToSubscriptions('add', {
			source: this.getKeyPath()
		}, (args, keyPath) => ({...args, value: this.getModifierFor(keyPath)}));
	}

	getGeneratedEntry()
	{
		return this.generated ? this.generated.entry : undefined;
	}

	getModifiedData(values)
	{
		const localValue = this.getModifiedValue();
		lodash.set(values, this.getKeyPath(), lodash.assignIn(
			typeof localValue === 'object' ? localValue : {},
			{
				toString: () => typeof localValue === 'object' ? undefined : `${localValue}`,
				asString: this.toString(),
			}
		));
		if (this.hasChildren())
		{
			lodash.values(this.getChildren()).forEach(
				(child) => child.getModifiedData(values)
			);
		}
	}

	getChildModifiedData(values)
	{
		const tmpValues = {};
		lodash.values(this.getChildren()).forEach(
			(child) => child.getModifiedData(tmpValues)
		);
		lodash.assign(values, lodash.get(tmpValues, this.getKeyPath()));
	}

	addListenerOnChanged(callback)
	{
		this.events.addEventListener('onChanged', callback);
	}

	removeListenerOnChanged(callback)
	{
		this.events.removeEventListener('onChanged', callback);
	}

	/**
	 * If, when generated, the entry resulted in a tangible value (not just children and a stringify).
	**/
	hasValue()
	{
		const generated = this.generated || {};
		return generated.value !== undefined;
	}

	getRawValue()
	{
		const generated = this.generated || {};
		const generatedObjValue = generated.value !== undefined && generated.value.value !== undefined ? generated.value.value : generated.value;
		if (generatedObjValue !== undefined) return generatedObjValue;
		return generated.entry !== undefined ? generated.entry.getKey() : undefined;
	}

	getModifyingEntryData_internal()
	{
		return (this.generated ? this.generated.modifiers : undefined) || {};
	}

	getModifyingEntryData()
	{
		return lodash.mapValues(this.getModifyingEntryData_internal(), (value, key) => this.getModifierFor(key));
	}

	getModifierFor(keyPath)
	{
		const getModifierInternal = (rawModifier) => {
			if (typeof rawModifier === 'object')
			{
				switch (rawModifier.type)
				{
					case 'multiply':
					{
						const localData = {};
						this.getChildModifiedData(localData);
						const multiplier = inlineEval(rawModifier.value, localData);
						if (multiplier === undefined) return rawModifier;
						const m = parseInt(multiplier, 10);
						return {
							type: rawModifier.type,
							multiply: m,
							toString: () => `*${m}`,
						};
					}
					case 'multiplyAdd':
					{
						const localData = {};
						this.getChildModifiedData(localData);
						const multiplier = inlineEval(rawModifier.multiply, localData);
						const adder = inlineEval(rawModifier.add, localData);
						if (multiplier === undefined || adder === undefined) return rawModifier;
						const m = parseInt(multiplier, 10);
						const a = parseInt(adder, 10);
						return {
							type: rawModifier.type,
							multiply: m,
							add: a,
							toString: () => `*${m}+${a}`,
						};
					}
					default:
						break;
				}
			}
			return rawModifier;
		};

		const rawModifier = this.getModifyingEntryData_internal()[keyPath];
		if (Array.isArray(rawModifier)) return rawModifier.map(getModifierInternal);
		else return getModifierInternal(rawModifier);
	}

	/**
	 * Get the key paths of entries this item is currently modifying.
	**/
	getModifyingEntryKeys()
	{
		return Object.keys(this.getModifyingEntryData());
	}

	/**
	 * Get the key paths of entries this item is currently being modified by.
	**/
	getModifiedByEntryKeys()
	{
		return {
			...this.modifierSources,
			...this.postOperationModifiers,
			...this.forcedFilter,
		}
	}

	addListenerOnModified(callback)
	{
		this.events.addEventListener('onModified', callback);
	}

	removeListenerOnModified(callback)
	{
		this.events.removeEventListener('onModified', callback);
	}

	/**
	 * Called when some entry adds or removes their modifiers from the total list of things this item is modified by.
	**/
	onModifiersChanged(evt, args)
	{
		const forcedFilter = lodash.cloneDeep(this.forcedFilter);
		if (Array.isArray(args.value)) args.value.forEach((v) => this.applyModifier(evt, args.source, v));
		else this.applyModifier(evt, args.source, args.value);
		this.events.dispatchEvent(new CustomEvent('onModified', { detail: {} }));

		const globalData = this.npc.getModifiedData();
		// TODO: This check is very inefficient, but it works...
		if (!objectEqualityDeepRecursive(forcedFilter, this.forcedFilter))
		{
			this.regenerate(globalData);
		}
		else
		{
			this.updateString(globalData);
		}
	}

	applyModifier(evt, source, value)
	{
		switch (evt)
		{
			case 'add':
				// These are forced value filters, where the value argument is the key of the desired value
				if (typeof value === 'string')
				{
					this.forcedFilter[source] = value;
				}
				// A macro of sorts that is executed on compilation
				else if (typeof value === 'object')
				{
					this.postOperationModifiers[source] = value;
				}
				else if (typeof value !== 'number') throw new Error(`Cannot use a modifier that is not a number: ${value}`);
				else if (value !== 0)
				{
					this.modifierSources[source] = value;
					this.totalModifyingValue += value;
				}
				break;
			case 'remove':
				// These are forced value filters, where the value argument is the key of the desired value
				if (typeof value === 'string')
				{
					delete this.forcedFilter[source];
				}
				// A macro of sorts that is executed on compilation
				else if (typeof value === 'object')
				{
					delete this.postOperationModifiers[source];
				}
				else if (typeof value !== 'number') throw new Error(`Cannot use a modifier that is not a number: ${value}`);
				else if (value !== 0)
				{
					delete this.modifierSources[source];
					this.totalModifyingValue -= value;
				}
				break;
			default:
				throw new Error(`Unknown modifiers changed event ${evt}, ${source}: ${value}`);
		}
		
	}

	getModifiedValue()
	{
		let value = this.getRawValue();
		if (typeof value === 'number')
		{
			const postOperations = Object.values(this.postOperationModifiers);
			if (postOperations.length > 0)
			{
				value = postOperations.reduce((retVal, modifier) => {
					switch (modifier.type)
					{
						case 'multiplyAdd':
							return retVal * modifier.multiply + modifier.add;
						case 'multiply':
							return retVal;// * modifier.multiply;
						default:
							throw new Error('Cannot process modifier object', value);
					}
				}, value);
			}
			value += this.totalModifyingValue;
		}
		return value;
	}

	getStringifyTemplate()
	{
		const genEntry = this.getGeneratedEntry();
		return (genEntry ? genEntry.getStringifyTemplate() : undefined) || (this.schemaEntry.stringify);
	}

	getDescription()
	{
		const genEntry = this.getGeneratedEntry();
		return (genEntry ? genEntry.getDescription() : undefined) || (this.schemaEntry.description);
	}

	getStringifyDependencies()
	{
		const template = this.getStringifyTemplate();
		if (!template) return [];
		const allMatches = Array.from(template.matchAll(PURE_VARIABLE_REGEX));
		const allNonlineageReplacements = allMatches.map((match) => match[1]).filter((key) => this.getChild(key) === undefined);
		return allNonlineageReplacements;
	}

	updateString(globalData)
	{
		const localizedGlobalData = lodash.cloneDeep(globalData);
		this.getChildModifiedData(localizedGlobalData);

		const stringify = this.getStringifyTemplate();
		this.stringifyCached = stringify ? inlineEval(stringify, localizedGlobalData) : `${this.getModifiedValue()}`;

		this.events.dispatchEvent(new CustomEvent('onUpdateString', {
			detail: {
				string: this.stringifyCached
			}
		}));

		if (this.parent) this.parent.updateString(globalData);
	}

	addListenerOnUpdateString(callback)
	{
		this.events.addEventListener('onUpdateString', callback);
	}

	removeListenerOnUpdateString(callback)
	{
		this.events.removeEventListener('onUpdateString', callback);
	}

	isValueEquivalentToNone()
	{
		return this.toString() === 'none';
	}

	toString()
	{
		return this.stringifyCached;
	}

	getArticleContent(globalData)
	{
		const genEntry = this.getGeneratedEntry();
		const articleContent = (genEntry ? genEntry.getArticleContent() : undefined) || (this.schemaEntry.articleContent);
		if (articleContent === undefined) { return this.toString(); }

		const localizedGlobalData = lodash.cloneDeep(globalData);
		this.getChildModifiedData(localizedGlobalData);

		return inlineEval(articleContent, localizedGlobalData);
	}

	getDescriptionString(globalData)
	{
		const description = this.getDescription();
		if (description === undefined) { return undefined; }
		
		const localizedGlobalData = lodash.cloneDeep(globalData);
		this.getChildModifiedData(localizedGlobalData);

		return inlineEval(description, localizedGlobalData);
	}

	onStringifyLinkerEvent(evt, { globalData })
	{
		console.assert(evt === 'onChanged');
		this.updateString(globalData);
	}

	getGenerationDependencies()
	{
		const field = this.getField();
		const source = field.hasSource() ? field.getSource() : undefined;
		if (!source) return [];
		const deps = [];
		for (let match of source.matchAll(PURE_VARIABLE_REGEX))
			deps.push(match[1]);
		return deps;
	}

	addListenerOnUpdateCollection(callback)
	{
		this.events.addEventListener('onUpdateCollection', callback);
	}

	removeListenerOnUpdateCollection(callback)
	{
		this.events.removeEventListener('onUpdateCollection', callback);
	}

	onGenerationDependencyEvent(evt, { key, globalData })
	{
		console.assert(evt === 'onChanged');
		Filter.remove(this.getKeyPath());
		this.regenerate(globalData);
	}

	getOurCollections()
	{
		return this.schemaEntry.collection !== undefined ? [this.schemaEntry.collection] : [];
	}

	getCollectionEntryKeys()
	{
		return this.collectionLinker.getSubscribedKeys();
	}

	onCollectionEntriesChanged(evt, {source})
	{
		this.events.dispatchEvent(new CustomEvent('onUpdateCollection', {
			detail: {
				entryKeys: this.getCollectionEntryKeys()
			}
		}));
	}

	hasChildren()
	{
		return this.generatedChildren && Object.keys(this.generatedChildren).length > 0;
	}

	getChildren()
	{
		return this.hasChildren() ? this.generatedChildren : {};
	}

	getChild(subpath)
	{
		const { items, remaining } = NpcData.sever(subpath);
		const children = this.getChildren();
		if (children.hasOwnProperty(items[0]))
		{
			const child = children[items[0]];
			return remaining.length > 0 ? child.getChild(remaining) : child;
		}
		else if (lodash.has(this.getRawValue(), subpath)) return this;
		else
		{
			//console.warn(`Could not find entry with subpath ${subpath} under entry ${this.getKeyPath()}`);
			return undefined;
		}
	}

	getSaveState()
	{
		const generated = this.generated || {};
		if (generated.entry) return generated.entry.getKey();
		else if (typeof generated.value !== 'object') return generated.value;
		else return undefined;
	}

	clearSaveState()
	{
		this.npc.updateSaveState(this.getKeyPath(), undefined);
		Object.values(this.getChildren()).forEach((child) => child.clearSaveState());
	}

	writeSaveState()
	{
		let saveState = this.getSaveState();
		if (this.generated && Array.isArray(this.generated.redirectPath)) saveState = this.generated.redirectPath.concat([saveState]);
		this.npc.updateSaveState(this.getKeyPath(), saveState);
	}

}