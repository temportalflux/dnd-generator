import lodash from 'lodash';
import TableCollection from './TableCollection';
import GeneratedEntry from './GeneratedEntry';

let NPC_TEMPORARY_DATA = null;

export default class NpcData
{

	static EVENTS = new EventTarget();
	static EVENT_INITIALIZED = 'onInitialized';

	static toggleOnInitialized(status, callback)
	{
		switch (status)
		{
			case 'on':
				NpcData.EVENTS.addEventListener(NpcData.EVENT_INITIALIZED, callback);
				break;
			case 'off':
				NpcData.EVENTS.removeEventListener(NpcData.EVENT_INITIALIZED, callback);
				break;
			default: break;
		}
	}

	static getSchema()
	{
		const tableCollection = TableCollection.get();
		return tableCollection ? tableCollection.getNpcSchema() : undefined;
	}

	static initialize()
	{
		const schema = NpcData.getSchema();
		if (!schema) { return; }
		
		console.log('Initializing NPC data');
		const data = new NpcData();

		const fields = schema.getFields();
		for (let field of fields)
		{
			data.addEntry(field);
		}

		NPC_TEMPORARY_DATA = data;

		NpcData.EVENTS.dispatchEvent(new CustomEvent(this.EVENT_INITIALIZED, {
			detail: { npc: NPC_TEMPORARY_DATA }
		}));

		NPC_TEMPORARY_DATA.regenerateAll();
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
		this.events = new EventTarget();

		this.entries = {};
		this.categories = {};
	}

	toggleListener(event, status, callback)
	{
		switch (status)
		{
			case 'on':
				this.events.addEventListener(event, callback);
				break;
			case 'off':
				this.events.removeEventListener(event, callback);
				break;
			default: break;
		}
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
		const schema = NpcData.getSchema();
		const globalData = {};
		for (let entryKey of schema.getGenerationOrder())
		{
			this.regenerate(entryKey, schema, globalData, globalData);
		}
	}

	regenerate(entryKey, schema, globalData, valuesOut)
	{
		const entry = this.entries[entryKey];
		entry.regenerate(schema, globalData);
		entry.getModifiedData(valuesOut);
	}

	forAllEntries(loop)
	{
		lodash.values(this.entries).forEach(loop);
	}

	getModifiedData()
	{
		const values = {}
		this.forAllEntries((entry) => entry.getModifiedData(values));
		return values;
	}

}