import lodash from 'lodash';
import parser from '../parser';
const { getTable } = require('../../Data');
const { formatWithData } = require('./utils');

function chooseRandomWithWeight(entries)
{
	const totalWeight = entries.reduce((accum, row) => accum + (row.weight || 1), 0);
	const randInt = require('../../lib/randInt')(1, totalWeight);

	var weight_sum = 0;
	for (var i = 0; i < entries.length; i++)
	{
		weight_sum += entries[i].weight || 1;
		if (randInt <= weight_sum)
		{
			return entries[i];
		}
	}

	return null;
}

function testFrequency(entries)
{
	let frequency = {};
	for (var i = 0; i < 10000; i++)
	{
		const value = chooseRandomWithWeight(entries);
		frequency[value] = (frequency[value] || 0) + 1;
	}
	return frequency;
}

export default function exec(match, data)
{
	const tablePath = formatWithData(match[1], data);
	let table = undefined;
	try
	{
		table = getTable(tablePath);
	}
	catch (e)
	{
		console.warn('No such table at path', tablePath, '\n', e);
		return undefined;
	}

	if (!table.rows)
	{
		console.error(`Table '${tablePath}' is missing field 'rows'. This field is enforced by the schema for tables.`, table);
		return undefined;
	}

	const appendModifiers = (current, toAppend) => {
		return lodash.toPairs(toAppend).reduce((accum, [key, modifier]) => {
			if (!accum.hasOwnProperty(key)) accum[key] = [];
			accum[key].push(modifier);
			return accum;
		}, current);
	};

	let result = chooseRandomWithWeight(table.rows);
	result.modifiers = result.modifiers || {};

	// Modifiers which are determined based on scales or regexs on the generated value
	if (table.modifiers)
	{
		for (let globalModifierEntry of table.modifiers)
		{
			let matchResult = parser(globalModifierEntry.match, { ...data, value: result.value });
			if (matchResult === true)
			{
				result.modifiers = appendModifiers(result.modifiers, globalModifierEntry.modifiers);
			}
		}
	}

	/*
	if (table.values && table.values[result.value])
	{

		const valueEntry = table.values[result.value];
		// Overwrite the value for the key 'value'
		// The writer has defined a more descriptive value
		if (valueEntry.value)
		{
			result.value = valueEntry.value;
		}
		// Values with modifiers are adding numerical data to other entries
		if (valueEntry.modifiers)
		{
			result.modifiers = appendModifiers(result.modifiers, valueEntry.modifiers);
		}
	}
	//*/

	//console.log(tablePath, result);

	return result;
}