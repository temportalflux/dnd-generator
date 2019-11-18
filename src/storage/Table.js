import lodash from 'lodash';
import { accumulateEntries } from './Entry';
import { createExecutor } from '../generator/modules/createExecutor';
import appendModifiers from '../generator/appendModifiers';
import { inlineEval } from '../generator/modules/evalAtCtx';

/**
 * Picks a random item from `entries`, using `entry.getWeight()` to get the weight for any
 * given item (assuming a weight of 1 if the function returns a falsey value).
 * Returns null if it was unable to determine a value. Assumes `entries` is non-empty.
*/
function chooseRandomWithWeight(entries)
{
	const totalWeight = entries.reduce((accum, row) => accum + (row.getWeight() || 1), 0);
	const randInt = require('../lib/randInt')(1, totalWeight);

	var weight_sum = 0;
	var i;
	for (i = 0; i < entries.length; i++)
	{
		weight_sum += entries[i].getWeight() || 1;
		if (randInt <= weight_sum)
		{
			return entries[i];
		}
	}

	console.warn(`'Returning null from \`chooseRandomWithWeight\`. i=${i} weight_sum=${weight_sum}`, entries);
	return null;
}

/**
 * A READONLY collective of randomizable entries with modifiers. It is loaded by a TableCollection,
 * and can be used to get a weighted random entry that it contains (see the `roll` function).
*/
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
		else if (obj.rows)
		{
			table.entries = accumulateEntries(obj.rows, `table '${key}'`, (i) => table.entriesWithoutKeys.push(i));
		}
		table.modifiers = obj.modifiers;
		table.redirect = obj.redirect;
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

		this.redirect = undefined;
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

	hasFilter()
	{
		return this.filter === undefined || this.filter !== false;
	}

	getFilterType()
	{
		return this.hasFilter() && this.filter !== undefined ? this.filter.type : undefined;
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
				return this.getOptions();
		}
	}

	hasGlobalModifiers()
	{
		return this.modifiers !== null && this.modifiers !== undefined && Object.keys(this.modifiers).length > 0;
	}

	getGlobalModifiers()
	{
		return this.modifiers;
	}

	hasRedirector()
	{
		return this.redirect !== undefined;
	}

	getRedirector()
	{
		return this.redirect;
	}

	// Performing ops

	roll(filter, context)
	{
		let result = { value: undefined, modifiers: {} };

		if (this.hasValueMacro())
		{
			const filterContext = { ...context, filter: (filter || this.getDefaultFilter()) };
			const macro = createExecutor(this.valueMacro);
			if (macro === undefined) result.value = inlineEval(this.valueMacro, filterContext);
			else result.value = macro(filterContext).value;
		}
		else if (this.hasRedirector())
		{
			const macro = createExecutor(`{roll:${this.getRedirector()}}`);
			if (macro) result = macro(context);
		}
		else
		{
			const rollable = this.getRows();
			const filtered = filter === undefined ? rollable : rollable.filter((entry) => filter.includes(entry.getKey()));
			const entry = chooseRandomWithWeight(filtered);
			if (entry === null)
			{
				console.warn('Received null generated value. Maybe there are missing keys?', this.entriesWithoutKeys, this.getKeyPath());
				return result;
			}
			result.value = lodash.cloneDeep(entry.value);
			result.modifiers = lodash.cloneDeep(entry.modifiers);
			result.entry = entry;
		}

		// Modifiers which are determined based on scales or regexs on the generated value
		if (this.hasGlobalModifiers())
		{
			for (let globalModifierEntry of this.getGlobalModifiers())
			{
				let matched = false;
				const macro = createExecutor(globalModifierEntry.match);
				if (macro)
				{
					let matchResult = macro({ ...context, value: result.value });
					matched = matchResult === true;
				}
				else
				{
					matched = result.value === globalModifierEntry.match;
				}
				if (matched)
				{
					result.modifiers = appendModifiers(result.modifiers, globalModifierEntry.modifiers);
				}
			}
		}
		
		result.modifiers = lodash.mapValues(result.modifiers, (modifierList, targetProperty) => {
			if (!Array.isArray(modifierList)) modifierList = [modifierList];
			return modifierList.map((modifier) => {
				// Preprocess each modifier to ensure that the modifiers remaining are either numbers or strings
				if (typeof modifier === 'object')
				{
					switch (modifier.type)
					{
						case 'curve':
							switch (modifier.curve)
							{
								case 'step':
									{
										const keyframes = Object.keys(modifier.values);
										let currentIndex = undefined;
										let nextIndex = keyframes.length > 0 ? 0 : undefined;
										while (nextIndex !== undefined
											&& parseInt(result.value, 10) > parseInt(keyframes[nextIndex], 10))
										{
											currentIndex = nextIndex;
											nextIndex++;
											if (nextIndex >= keyframes.length) nextIndex = undefined;
										}
										return currentIndex ? modifier.values[keyframes[currentIndex]] : 0;
									}
								case 'lerp':
									{
										const valueInt = parseInt(result.value, 10);

										const keyframes = Object.keys(modifier.values);
										const getInt = (i) => parseInt(keyframes[i], 10);
										let lowerIndex = undefined;
										let higherIndex = keyframes.length > 0 ? 0 : undefined;
										while (higherIndex !== undefined
											&& valueInt > getInt(higherIndex))
										{
											lowerIndex = higherIndex;
											higherIndex++;
											if (higherIndex >= keyframes.length) higherIndex = undefined;
										}

										if (lowerIndex === undefined)
										{
											lowerIndex = higherIndex;
										}
										else if (higherIndex === undefined)
										{
											higherIndex = lowerIndex;
										}

										const lowerInput = getInt(lowerIndex);
										const higherInput = getInt(higherIndex);
										const lowerMod = modifier.values[keyframes[lowerIndex]];
										const higherMod = modifier.values[keyframes[higherIndex]];

										const t = (valueInt - lowerInput) / (higherInput !== lowerInput ? higherInput - lowerInput : higherInput);
										const lerped = (1 - t) * lowerMod + (t * higherMod);

										if (modifier.toIntOp === undefined) return lerped;
										const intOp = Math[modifier.toIntOp];
										if (intOp === undefined)
										{
											console.warn('Encountered unimplemented curve int cast operator:', modifier.toIntOp);
											return 0;
										}
										else
										{
											return intOp(lerped);
										}
									}
								default: break;
							}
							break;
						default: break;
					}
				}
				return modifier;
			});
		});

		return result;
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
