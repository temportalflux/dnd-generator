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
		this.stringify = undefined;
		this.modifiers = {};

		this.children = [];

		this.canReroll = undefined;
	}

	readFrom(data, idx)
	{
		this.weight = data.weight || 1;
		this.key = data.key;
		this.index = idx;

		this.redirect = data.redirect;
		this.source = data.source;

		this.value = data.value;
		this.stringify = data.stringify;

		this.childrenWithoutKeys = [];
		this.children = accumulateEntries(data.children || [], `entry '${this.key}'`, (i) => this.childrenWithoutKeys.push(i));

		this.modifiers = data.modifiers || {};

		this.canReroll = data.canReroll;
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

	getCanReroll()
	{
		return this.canReroll === undefined || this.canReroll === true;
	}

}