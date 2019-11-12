import lodash from 'lodash';
import TableCollection from './TableCollection';
import GeneratedEntry from './GeneratedEntry';

let NPC_TEMPORARY_DATA = null;

export default class NpcData
{

	static getSchema()
	{
		return TableCollection.get().getNpcSchema();
	}

	static initialize()
	{
		const data = new NpcData();

		const fields = NpcData.getSchema().getFields();
		for (let field of fields)
		{
			data.addEntry(field);
		}

		NPC_TEMPORARY_DATA = data;
	}

	static get()
	{
		return NPC_TEMPORARY_DATA;
	}

	static clear()
	{
		NpcData.initialize();
	}

	constructor()
	{
		this.entries = {};
		this.categories = {};
	}

	addEntry(field)
	{
		const entry = GeneratedEntry.fromSchema(field);
		this.entries[entry.getKeyPath()] = entry;
		this.categories[field.category] = (this.categories[field.getCategory()] || []).concat([field.getKey()]);
	}

	getEntry(keyPath)
	{
		return this.entries[keyPath];
	}

	getCategories()
	{
		return Object.keys(this.categories).sort();
	}

	getEntriesForCategory(category)
	{
		return (this.categories[category] || []).sort();
	}

	regenerateAll()
	{
		for (let entryKey of NpcData.getSchema().getGenerationOrder())
		{
			this.regenerate(entryKey);
		}
	}

	regenerate(entryKey)
	{
		this.entries[entryKey].regenerate();
	}

}