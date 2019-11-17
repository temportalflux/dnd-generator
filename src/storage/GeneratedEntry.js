import Filter from './Filter';
import lodash from 'lodash';
import { createExecutor } from '../generator/modules/createExecutor';
import { inlineEval, VARIABLE_REGEX } from '../generator/modules/evalAtCtx';
import NpcData from './NpcData';

class EntryLinker
{

	constructor(owner, property, onEvent)
	{
		this.owner = owner;
		this.property = property;
		this.subscribed = [];
		this.onEvent = onEvent;
	}

	getEntryForPath(entryPath)
	{
		return NpcData.get().getEntry(entryPath);
	}

	subscribe(entryPaths)
	{
		entryPaths.forEach((path) =>
		{
			const entry = this.getEntryForPath(path);
			if (entry) entry[this.property].add(this.owner);
		});
	}

	unsubscribe(entryPaths)
	{
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

	static fromSchema(field)
	{
		const data = new GeneratedEntry();
		data.readEntry(field);
		data.category = field.getCategory();
		return data;
	}

	static fromEntry(entry)
	{
		const data = new GeneratedEntry();
		data.readEntry(entry);
		return data;
	}

	constructor()
	{
		this.events = new EventTarget();
		this.schemaEntry = undefined;

		this.stringifyLinker = new EntryLinker(this, 'stringifyLinker', this.onStringifyLinkerEvent.bind(this));
		this.stringifyCached = undefined;

		this.generationDependencyLinker = new EntryLinker(this, 'generationDependencyLinker', this.onGenerationDependencyEvent.bind(this));

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

	getFilterValue()
	{
		return Filter.get(this.getKeyPath());
	}

	regenerate(globalData)
	{
		this.generationDependencyLinker.unsubscribe(this.getGenerationDependencies());
		this.stringifyLinker.unsubscribe(this.getStringifyDependencies());

		const context = {
			...globalData,
			filter: this.getFilterValue(),
		};
		this.generated = null;

		if (this.schemaEntry.value)
		{
			this.generated = {
				value: this.schemaEntry.value
			};
		}
		else
		{
			do
			{
				let macro = undefined;
				if (this.generated && this.generated.entry && this.generated.entry.hasRedirector())
					macro = createExecutor(`{roll:${this.generated.entry.getRedirector()}}`);
				else macro = this.getGenerationMacro();
				if (macro === undefined) break;
				this.generated = macro(context);
			} while (this.generated && this.generated.entry && this.generated.entry.hasRedirector());
		}

		this.generatedChildren = this.generated && this.generated.entry && this.generated.entry.hasChildren()
			? lodash.mapValues(this.generated.entry.getChildren(), (child) =>
			{
				const clone = GeneratedEntry.fromEntry(child);
				clone.parent = this;
				return clone;
			}) : undefined;
		if (this.generatedChildren === undefined && this.schemaEntry && this.schemaEntry.hasChildren())
		{
			this.generatedChildren = lodash.mapValues(this.schemaEntry.getChildren(), (child) =>
			{
				const clone = GeneratedEntry.fromEntry(child);
				clone.parent = this;
				return clone;
			});
		}

		// TODO: Check to see if the entry actually changed at all (key may have changed of the underlying generated entry),
		// otherwise if the value hasn't changed, all of these updates are being processed for no reason.

		this.updateString(globalData);
		this.stringifyLinker.subscribe(this.getStringifyDependencies());

		// temporarily modify globalData until it can be accounted for later
		// we should probably just mark the data as dirty here instead of passing it through functions
		this.getModifiedData(globalData);

		this.events.dispatchEvent(new CustomEvent('onChanged', { detail: {} }));

		this.stringifyLinker.dispatchToSubscribers('onChanged', { globalData });

		this.generationDependencyLinker.subscribe(this.getGenerationDependencies());
		this.generationDependencyLinker.dispatchToSubscribers('onChanged', { key: this.getKeyPath(), globalData });

		if (this.generatedChildren)
		{
			lodash.values(this.generatedChildren).forEach((child) => child.regenerate(globalData));
		}
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
		const genEntry = this.getGeneratedEntry();
		return generated.value || (genEntry ? genEntry.getKey() : undefined);
	}

	getModifiedValue()
	{
		// TODO
		return this.getRawValue();
	}

	getModifiers()
	{
		return (this.generated ? this.generated.modifiers : undefined) || {};
	}

	getStringifyTemplate()
	{
		const genEntry = this.getGeneratedEntry();
		return (genEntry ? genEntry.getStringifyTemplate() : undefined) || (this.schemaEntry.stringify);
	}

	getStringifyDependencies()
	{
		const template = this.getStringifyTemplate();
		if (!template) return [];
		const allMatches = Array.from(template.matchAll(VARIABLE_REGEX));
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

	toString()
	{
		return this.stringifyCached;
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
		for (let match of source.matchAll(VARIABLE_REGEX))
			deps.push(match[1]);
		return deps;
	}

	onGenerationDependencyEvent(evt, { key, globalData })
	{
		console.assert(evt === 'onChanged');
		this.regenerate(globalData);
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

}