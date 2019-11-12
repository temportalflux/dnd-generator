import lodash from 'lodash';

export function accumulateEntries(data, context, onUndefinedKey=undefined)
{
	return data.reduce((accum, entryData) =>
	{
		const entry = Entry.from(entryData);
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

	static from(data)
	{
		const entry = new Entry();
		entry.readFrom(data);
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

	readFrom(data)
	{
		this.weight = data.weight || 1;
		this.key = data.key;

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

}