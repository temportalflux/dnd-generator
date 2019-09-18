
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
			return entries[i].value;
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

module.exports = function exec(match)
{
	const tablePath = match[1];
	console.log(`Rolling on '${tablePath}'`);
	try
	{
		const table = require(`../../../data/data/${tablePath}`);

		if (!table.rows)
		{
			console.error(`Table '${tablePath}' is missing field 'rows'. This field is enforced by the schema for tables.`, table);
			return undefined;
		}
		
		return chooseRandomWithWeight(table.rows);
	}
	catch (e)
	{
		console.error(e);
		return undefined;
	}
}