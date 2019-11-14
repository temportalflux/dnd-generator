import lodash from 'lodash';
import {parseMacro} from '../generator/modules/createExecutor';

export function accumulateEntries(data, context, onUndefinedKey=undefined)
{
	return data.reduce((accum, entryData, i) =>
	{
		const entry = Entry.from(entryData, i);
		if (entry.getKey() === undefined)
		{
			if (onUndefinedKey !== undefined && typeof onUndefinedKey === 'function')
			{
				onUndefinedKey(entry);
			}
			//console.warn(`Encountered invalid key in ${context} at entry`, entryData);
			return accum;
		}
		accum[entry.getKey()] = entry;
		return accum;
	}, {});
}

export class Entry
{

	static fromStorage(obj)
	{
		const entry = new Entry();
		entry.readStorage(obj);
		return entry;
	}

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

		this.source = undefined;

		this.value = undefined;
		this.stringify = undefined;
		this.modifiers = {};

		this.children = [];
	}

	readStorage(obj)
	{
		lodash.assignIn(this, obj);
		this.children = lodash.mapValues(this.children || [], Entry.fromStorage);
	}

	readFrom(data, idx)
	{
		this.weight = data.weight || 1;
		this.key = data.key || idx;

		this.source = data.source;

		this.value = data.value;
		this.stringify = data.stringify;

		this.childrenWithoutKeys = [];
		this.children = accumulateEntries(data.children || [], `entry '${this.key}'`, (i) => this.childrenWithoutKeys.push(i));

		this.modifiers = data.modifiers || {};
	}

	getKey()
	{
		return this.key;
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

	hasChildren()
	{
		return Object.keys(this.children).length > 0;
	}

	getChildren() { return this.children; }

}