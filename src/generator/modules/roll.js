import lodash from 'lodash';
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
			return entries[i].default || entries[i].value;
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

export default function exec(match, npcData)
{
	const tablePath = formatWithData(match[1], npcData);
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
	
	let currentValue = chooseRandomWithWeight(table.rows);
	console.log('Roll on table', tablePath, 'resulted in', currentValue);

	if (table.values && table.values[currentValue])
	{
		const valueEntry = table.values[currentValue];
		// Overwrite the value for the key 'value'
		// The writer has defined a more descriptive value
		if (valueEntry.value)
		{
			currentValue = valueEntry.value;
		}
		// Overrides mean that more data is being generated from here
		if (valueEntry.override)
		{

		}
		// Values with modifiers are adding numerical data to other entries
		if (valueEntry.modifiers)
		{
			lodash.toPairs(valueEntry.modifiers).forEach(([key, modifier]) => {
				const prevValue = lodash.get(npcData, key) || 0;
				lodash.set(npcData, key, prevValue + modifier);
				console.log(`(${key}) ${prevValue} += ${modifier} => ${lodash.get(npcData, key)}`);
			});
		}
	}

	return currentValue;
}