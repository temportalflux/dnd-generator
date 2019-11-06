import lodash from 'lodash';
import storage from 'local-storage';
import TableCollection from './TableCollection';
import GeneratedEntry from './GeneratedEntry';

export default class NpcData
{

	static getSchema()
	{
		return TableCollection.get().getNpcSchema();
	}

	static initialize()
	{
		const data = new NpcData();
		data.save();
	}

	static get()
	{
		const saved = storage.get('npc');
		return saved === null ? null : NpcData.fromStorage(saved);
	}

	static clear()
	{
		storage.remove('npc');
		NpcData.initialize();
	}

	static fromStorage(obj)
	{
		const data = new NpcData();
		data.readStorage(obj);
		return data;
	}

	constructor()
	{
		this.entries = {};
	}

	readStorage(data)
	{
		this.entries = lodash.mapValues(data.entries, (e) => GeneratedEntry.fromStorage(this, e));
	}

	save()
	{
		storage.set('npc', this);
	}

	regenerateAll()
	{
		for (let entryKey of getSchema().getGenerationOrder())
		{
			this.regenerate(entryKey);
		}
	}

	regenerate(entryKey)
	{

	}

}