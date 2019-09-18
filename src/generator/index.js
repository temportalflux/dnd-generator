import lodash from 'lodash';
import parser from './parser';
const { getTable } = require('../Data');

export function generate(filter)
{
	const npc = getTable('npc');
	const npcData = lodash.toPairs(filter).reduce((allData, [categoryKey, fieldsObj]) =>
	{
		return lodash.toPairs(fieldsObj)
			.filter(([_, value]) => value !== 'random')
			.reduce((categoryData, [fieldKey, value]) =>
			{
				lodash.set(categoryData, `${categoryKey}.${fieldKey}`, value);
				return categoryData;
			}, allData);
	}, {});

	console.log('Starting npc generation with default filter fields:', lodash.cloneDeep(npcData));

	for (let valueKey of npc.generationOrder)
	{
		const field = lodash.get(npc.fields, valueKey);
		const currentValue = lodash.get(npcData, valueKey);
		if (currentValue === undefined)
		{
			if (field.default)
			{
				const parsedValue = parser(field.default);
				if (parsedValue)
					lodash.set(npcData, valueKey, parsedValue);
			}
			if (field.value)
			{
				const parsedValue = parser(field.value, npcData);
				if (parsedValue)
					lodash.set(npcData, valueKey, parsedValue);
			}
		}
		else
		{
			console.log(`Skipping generation for field "${valueKey}".`, `\nIts value is already "${currentValue}".`);
		}
		console.log('Finished generating field', valueKey);
		console.log('Context data now is', lodash.cloneDeep(npcData));
	}
	return npcData;
}
