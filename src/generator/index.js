import lodash from 'lodash';
import parser from './parser';
const { getTable } = require('../Data');

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
	let npcData = createDefaultDataFromFilter(filter);

	console.log('Starting npc generation with default filter fields:', lodash.cloneDeep(npcData));

	npcData = iterateGenerationOrder(npc, npcData, (data, key, field, currentValue) => {
		if (!field) return data;
		if (currentValue === undefined)
		{
			if (field.default)
			{
				const parsedValue = parser(field.default);
				if (parsedValue)
					lodash.set(data, key, parsedValue);
			}
		}
		else
		{
			console.log(`Skipping default generation for field "${key}".`, `\nIts value is already "${currentValue}".`);
		}
		return data;
	});

	npcData = iterateGenerationOrder(npc, npcData, (data, key, field, currentValue) => {
		if (!field) return data;
		if (currentValue === undefined)
		{
			if (field.value)
			{
				const parsedValue = parser(field.value, data);
				if (parsedValue)
					lodash.set(data, key, parsedValue);
			}
		}
		else
		{
			console.log(`Skipping value generation for field "${key}".`, `\nIts value is already "${currentValue}".`);
		}
	});

	return npcData;
}
