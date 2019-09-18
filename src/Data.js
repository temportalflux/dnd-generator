const path = require('path');
const lodash = require('lodash');

function makeEntry(name, value)
{
	return {
		key: value.toLowerCase().replace(' ', '-'),
		text: name,
		value: value.toLowerCase().replace(' ', '-'),
	};
}

function getTable(tablePath)
{
	return require(`./data/tables/${tablePath}.json`);
}

function getEntriesFromTable(table)
{
	return table.rows.map((row) => makeEntry(row.text || row.value, row.value));
}

function getOptions(currentData)
{
	if (this.table)
	{
		return getEntriesFromTable(getTable(this.table));
	}
	else if (this.options)
	{
		const tablePath = this.options.keys.reduce((accum, key) => `${accum}/${lodash.get(currentData, key)}`, this.options.folder);
		try
		{
			const table = getTable(tablePath);
			return getEntriesFromTable(table);
		}
		catch (e)
		{
			return [];
		}
	}
	return 2;
}

function createFieldInfo(categoryKey, fieldData)
{
	return {
		key: `${categoryKey}.${fieldData.key}`,
		text: fieldData.text,
		getOptions: getOptions.bind(fieldData),
		dependsOn: fieldData.options ? fieldData.options.keys || [] : [],
	};
}

module.exports = {
	randomEntry: makeEntry("Random", 'random'),
	getTable: getTable,
	makeEntry: makeEntry,
	categories: getTable('filters').categories.map(
		(category) => ({
			key: category.key,
			fields: category.fields.map((field) => createFieldInfo(category.key, field)),
		})
	)
};
