import lodash from 'lodash';
import storage from 'local-storage';
import TableCollection from './TableCollection';

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
	}

	readStorage(data)
	{
	}

	save()
	{
		storage.set('npc', this);
	}

}