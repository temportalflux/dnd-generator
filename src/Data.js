const path = require('path');
const lodash = require('lodash');

const filterFields = [
	'race',
	'sex', 'forcealign', 'hooks',
	'occupation', 'class', 'profession',
];

function makeEntry(name, value)
{
	return {
		key: value.toLowerCase().replace(' ', '-'),
		text: name,
		value: value.toLowerCase().replace(' ', '-'),
	};
}

class DataHandler
{

	constructor()
	{
		this.randomEntry = makeEntry("Random", 'random');

		this.tables = filterFields.reduce((accum, field) => {
			accum[field] = this.getRowsForTable(field);
			accum[field].unshift(this.randomEntry);
			return accum;
		}, {});
		
		this.tables.subrace = this.tables.race.filter((entry) => entry.value !== 'random').reduce((accum, entry) => {
			accum[entry.value] = this.getRowsForTable(`race${entry.value}`);
			if (accum[entry.value].length > 0)
				accum[entry.value].unshift(this.randomEntry);
			return accum;
		}, {});
		
		this.tables.professionTypes = this.tables.profession.filter((entry) => entry.value !== 'random').reduce((accum, entry) => {
			accum[entry.value] = this.getRowsForTable(`${entry.value}`);
			accum[entry.value].unshift(this.randomEntry);
			return accum;
		}, {});
	}

	getRowsForTable(field)
	{
		try
		{
			return require(`./data/${field}.json`)
				.filter((entry) => entry.name)
				.map((entry) => makeEntry(entry.name, entry.table || entry.value || entry.name));
		}
		catch(e)
		{
			return [];
		}
	}

}

const Data = new DataHandler();
export default Data;
