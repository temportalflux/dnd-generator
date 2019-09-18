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
	return require(path.join('../data/tables', tablePath));
}

module.exports = {
	randomEntry: makeEntry("Random", 'random'),
	getTable: getTable,
	makeEntry: makeEntry,
	categories: [
		{
			"name": "Identity",
			"key": "identity",
			"filters": [
				{
					"key": "sex",
					"name": "Sex",
					"values": [
						'male', 'female', 'intersex'
					]
				}
			]
		},
		{
			"name": "Description",
			"key": "description",
			"filters": [
				{
					"name": "Race",
					"key": "race",
					"values": [
						"A", "B", "C"
					]
				},
				{
					"name": "Subrace",
					"key": "subrace",
					"values": {
						"{description.race=A}": ["A1", "A2", "A3"],
						"{description.race=B}": ["B1", "B2", "B3"]
					}
				}
			]
		}
	]
};
