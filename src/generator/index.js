import lodash from 'lodash';
//import parser from './parser';
import {Generator} from './Generator';
const { getTable } = require('../Data');

/*
function iterateGenerationOrder(schema, data, loop)
{
	for (let valueKey of schema.generationOrder)
	{
		data = loop(
			data,
			valueKey,
			lodash.get(schema.fields, valueKey),
			lodash.get(data, valueKey)
		);
	}
	return data;
}
//*/

function createDefaultDataFromFilter(filter)
{
	return lodash.toPairs(filter).reduce((allData, [categoryKey, fieldsObj]) =>
	{
		return lodash.toPairs(fieldsObj)
			.filter(([_, value]) => value !== 'random')
			.reduce((categoryData, [fieldKey, value]) =>
			{
				lodash.set(categoryData, `${categoryKey}.${fieldKey}`, value);
				return categoryData;
			}, allData);
	}, {});
}

export function generate(filter)
{
	const npc = getTable('npc');

	const generator = new Generator();
	npc.fieldOrder.forEach((fullKey) => {
		const {items, remaining} = Generator.sever(fullKey);
		generator.addField(items[0], remaining, npc.fields[items[0]][remaining]);
	});

	let dataWithFilters = createDefaultDataFromFilter(filter);
	console.log('Starting npc generation with default (filter) fields:', lodash.cloneDeep(dataWithFilters));

	for (let key of npc.generationOrder)
	{
		generator.regenerate(key);
	}

	console.log(lodash.cloneDeep(generator));

	return generator;

	/*
	let dataWithValues = iterateGenerationOrder(npc, dataWithFilters,
		(data, key, field, _) =>
		{
			// There is no item in the fields object of npc for this key - this is probably an error in the table
			if (!field)
			{
				console.warn(`Field ${key} exists in the generation order for 'npc.json' but does not have a corresponding entry in 'fields'. This will be ignored`);
				return data;
			}

			// Assume that all contents of the field are the field's properties

			const parsedValue = parser(field, data);
			// Parser could return an undefined value if the command didn't work.
			// For example, a table like 'beard' is assumed to have an entry for every race,
			// so races can opt-in by defining a beard.json table. If one is missing, this is not an error,
			// but rather the race opting-out of generating beard data.
			if (parsedValue !== undefined)
			{
				lodash.set(data, key, parsedValue);
			}

			return data;
		}
	);

	return {
		meta: npc.metadata,
		values: dataWithValues,
	};
	//*/
}
