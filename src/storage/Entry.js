import {parseMacro} from '../generator/modules/createExecutor';

export function accumulateEntries(data, context, onUndefinedKey=undefined)
{
	return data.reduce((accum, entryData, i) =>
	{
		const entry = Entry.from(entryData, i);
		if (entry.key === undefined)
		{
			if (onUndefinedKey !== undefined && typeof onUndefinedKey === 'function')
			{
				onUndefinedKey(entry);
			}
		}
		accum[entry.getKey()] = entry;
		return accum;
	}, {});
}

export class Entry
{

	static from(data, idx)
	{
		const entry = new Entry();
		entry.readFrom(data, idx);
		return entry;
	}

	constructor()
	{
		this.weight = undefined;
		this.key = undefined;

		this.redirect = undefined;
		this.source = undefined;

		this.value = undefined;
		this.modifiers = {};

		this.stringify = undefined;
		this.description = undefined;
		this.articleContent = undefined;

		// defines if the entry is can disabled
		this.bIsOptional = false;

		this.children = [];

		this.canReroll = undefined;
		/**
		 * The key for another entry, whose value is an array,
		 * which GeneratedEntries that this entry is a schema for,
		 * are considered a part of during `GeneratedEntry#getModifiedData`.
		**/
		this.collection = undefined;
	}

	readFrom(data, idx)
	{
		this.weight = data.weight || 1;
		this.key = data.key;
		this.index = idx;

		this.redirect = data.redirect;
		this.source = data.source;

		this.value = data.value;
		this.modifiers = data.modifiers || {};

		this.stringify = data.stringify;
		this.description = data.description;
		this.articleContent = data.articleContent;
		this.bIsOptional = data.isOptional;

		this.childrenWithoutKeys = [];
		this.children = accumulateEntries(data.children || [], `entry '${this.key}'`, (i) => this.childrenWithoutKeys.push(i));

		this.canReroll = data.canReroll;
		this.collection = data.collection;
	}

	hasKey()
	{
		return this.key !== undefined;
	}

	getKey()
	{
		return this.key || this.index;
	}

	hasSource()
	{
		return typeof this.source === 'string';
	}

	getSource()
	{
		return this.source;
	}

	getWeight()
	{
		// TODO: fetch from local storage
		return this.weight;
	}

	getSourceTableKey()
	{
		if (!this.hasSource()) return undefined;
		const executor = parseMacro(this.source);
		if (executor.execFunc !== 'roll') return undefined;
		return executor.args;
	}

	isMissingSourceTable(tableCollection, evaluateWithData)
	{
		if (!this.hasSource()) return false;
		const tablePath = this.getSourceTableKey();
		if (!tablePath) return false;
		return tableCollection.getTable(evaluateWithData(tablePath)) === undefined;
	}

	hasRedirector()
	{
		return typeof this.redirect === 'string';
	}

	getRedirector()
	{
		return this.redirect;
	}

	hasChildren()
	{
		return Object.keys(this.children).length > 0;
	}

	getChildren() { return this.children; }

	getStringifyTemplate()
	{
		return this.stringify;
	}

	getArticleContent()
	{
		return this.articleContent;
	}

	getDescription()
	{
		return this.description;
	}

	getCanReroll()
	{
		return this.canReroll === undefined || this.canReroll === true;
	}

	isOptional()
	{
		return this.bIsOptional;
	}

}