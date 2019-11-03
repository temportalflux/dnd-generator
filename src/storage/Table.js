import lodash from 'lodash';

function accumulateEntries(data, context, onUndefinedKey=undefined)
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

class Entry
{

	static fromStorage(obj, key)
	{
		const entry = new Entry();
		lodash.assignIn(entry, obj);
		entry.children = lodash.mapValues(entry.children || [], Entry.fromStorage);
		return entry;
	}

	static from(data)
	{
		const entry = new Entry();

		entry.weight = data.weight || 1;
		entry.key = data.key;

		entry.source = data.source;

		entry.value = data.value;
		entry.stringify = data.stringify;

		entry.childrenWithoutKeys = [];
		entry.children = accumulateEntries(data.children || [], `entry '${this.key}'`, (i) => entry.childrenWithoutKeys.push(i));
		return entry;
	}

	constructor()
	{
		this.weight = undefined;
		this.key = undefined;

		this.source = undefined;

		this.value = undefined;
		this.stringify = undefined;

		this.children = undefined;
	}

	getKey()
	{
		return this.key;
	}

}

export default class Table
{

	static EVENT_ONCHANGEDFILTER = 'onChangedFilter';

	static fromStorage(obj, key)
	{
		const table = new Table();
		table.key = key;
		table.entries = lodash.mapValues(obj.entries, Entry.fromStorage);
		return table;
	}

	// takes a json object
	static from(obj, key)
	{
		const table = new Table();
		table.key = key;
		// turn json data for a table's entry rows into objects
		table.entriesWithoutKeys = [];
		table.entries = accumulateEntries(obj.rows, `table '${key}'`, (i) => table.entriesWithoutKeys.push(i));
		return table;
	}

	constructor()
	{
		this.events = new EventTarget();

		this.key = undefined;
		this.entries = {};

		this.filter = [];
	}

	getKey()
	{
		return this.key;
	}

	getKeyPath()
	{
		return this.getKey().replace(/\//g, '.');
	}

	static getKeyFromKeyPath(keyPath)
	{
		return keyPath.replace(/\./g, '/');
	}

	length()
	{
		return Object.keys(this.entries).length;
	}

	getRows()
	{
		return Object.values(this.entries);
	}

	addRow(entry)
	{
		this.entries.push(entry);
		this.dispatchOnChangedRowCount(this.entries.length - 1, this.entries.length);
	}

	removeRow(entry)
	{
		this.entries.splice(this.entries.indexOf(entry), 1);
		this.dispatchOnChangedRowCount(this.entries.length, this.entries.length - 1);
	}

	dispatchOnChangedRowCount(prev, next)
	{
		this.events.dispatchEvent(new CustomEvent('onChangedRowCount', {
			detail: { prev, next }
		}));
	}

	// TODO: This will never work because Tables are deserialized from the local storage
	subscribeOnChangedRowCount(callback)
	{
		this.events.addEventListener('onChangedRowCount', callback);
	}

	unsubscribeOnChangedRowCount(callback)
	{
		this.events.removeEventListener('onChangedRowCount', callback);
	}

	// Viewing the table via react

	getOptions()
	{
		return this.getRows().map((entry) => ({
			key: entry.getKey(), text: entry.getKey(), value: entry.getKey()
		}));
	}

}

Table.COLUMNS = [
	{
		accessor: 'weight',
		Header: 'Weight',
	},
	{
		accessor: 'key',
		Header: 'Key',
	}
];
