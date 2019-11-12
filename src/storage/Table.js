import lodash from 'lodash';
import { Entry, accumulateEntries } from './Entry';
import { createExecutor } from '../generator/modules/createExecutor';
import appendModifiers from '../generator/appendModifiers';
import { inlineEval } from '../generator/modules/evalAtCtx';

function chooseRandomWithWeight(entries)
{
	const totalWeight = entries.reduce((accum, row) => accum + (row.getWeight() || 1), 0);
	const randInt = require('../lib/randInt')(1, totalWeight);

	var weight_sum = 0;
	for (var i = 0; i < entries.length; i++)
	{
		weight_sum += entries[i].getWeight() || 1;
		if (randInt <= weight_sum)
		{
			return entries[i];
		}
	}

	return null;
}

export default class Table
{

	static EVENT_ONCHANGEDFILTER = 'onChangedFilter';

	static getTablePathFromKeyPath(keyPath)
	{
		return keyPath.replace(/\./g, '/');
	}

	static getKeyPathFromTablePath(tablePath)
	{
		return tablePath.replace(/\//g, '.');
	}

	static fromStorage(obj, key)
	{
		const table = new Table();
		table.key = key;
		table.filter = obj.filter;
		table.valueMacro = obj.valueMacro;
		table.entries = lodash.mapValues(obj.entries, Entry.fromStorage);
		table.modifiers = obj.modifiers;
		return table;
	}

	// takes a json object
	static from(obj, key)
	{
		const table = new Table();
		table.key = key;
		table.filter = obj.filter;
		// turn json data for a table's entry rows into objects
		table.entriesWithoutKeys = [];
		if (obj.valueMacro)
		{
			table.valueMacro = obj.valueMacro;
			table.entries = null;
		}
		else
		{
			table.entries = accumulateEntries(obj.rows, `table '${key}'`, (i) => table.entriesWithoutKeys.push(i));
		}
		table.modifiers = obj.modifiers;
		return table;
	}

	constructor()
	{
		this.events = new EventTarget();

		this.key = undefined;
		this.filter = undefined;
		// The macro used to generate a value based on the filter
		this.valueMacro = undefined;
		// All the possible options available for randomization (and filtering)
		this.entries = {};
		// Global modifiers that can (and should) be applied to any entry after being rolled.
		this.modifiers = {};
	}

	getKey()
	{
		return this.key;
	}

	getKeyPath()
	{
		return Table.getKeyPathFromTablePath(this.getKey());
	}

	hasValueMacro()
	{
		return this.valueMacro !== undefined;
	}

	length()
	{
		return this.entries !== null ? Object.keys(this.entries).length : 1;
	}

	getRows()
	{
		return this.entries !== null ? Object.values(this.entries) : [];
	}

	addRow(entry)
	{
		if (this.entries === null) { return; }
		this.entries.push(entry);
		this.dispatchOnChangedRowCount(this.entries.length - 1, this.entries.length);
	}

	removeRow(entry)
	{
		if (this.entries === null) { return; }
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
		console.error('Changed callbacks will never work on tables');
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

	getFilterType()
	{
		return this.filter !== undefined ? this.filter.type : undefined;
	}

	getDefaultFilter()
	{
		switch (this.getFilterType())
		{
			case 'minMaxRange':
				return {
					min: this.filter.min,
					max: this.filter.max,
				};
			default:
				return undefined;
		}
	}

	// Performing ops

	roll(filter, context)
	{
		console.log(this);

		if (this.hasValueMacro())
		{
			const filterContext = { ...context, filter: (filter || this.getDefaultFilter()) };
			const macro = createExecutor(this.valueMacro);
			if (macro === undefined) return inlineEval(this.valueMacro, filterContext);
			else return macro(filterContext);
		}

		const rollable = this.getRows();
		const filtered = filter === undefined ? rollable : rollable.filter((entry) => filter.includes(entry.getKeyPath()));
		const entry = chooseRandomWithWeight(filtered);
		
		let result = {
			value: lodash.cloneDeep(entry.value),
			modifiers: lodash.cloneDeep(entry.modifiers),
		};

		console.log(result);

		// Modifiers which are determined based on scales or regexs on the generated value
		if (this.hasGlobalModifiers())
		{
			for (let globalModifierEntry of this.getGlobalModifiers())
			{
				let matchResult = createExecutor(globalModifierEntry.match)({ ...context, value: result.value });
				if (matchResult === true)
				{
					result.modifiers = appendModifiers(result.modifiers, globalModifierEntry.modifiers);
				}
			}
		}

		return result;
	}

	hasGlobalModifiers()
	{
		return this.modifiers.length > 0;
	}

	getGlobalModifiers()
	{
		return this.modifiers;
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
