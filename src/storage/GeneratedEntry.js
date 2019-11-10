import lodash from 'lodash';

export default class GeneratedEntry
{

	static fromStorage(owner, obj)
	{
		const data = new NpcData(owner);
		data.readStorage(obj);
		return data;
	}

	constructor(owner)
	{
		this.owner = owner;
	}

	readStorage(data)
	{
	}

	save()
	{
		this.owner.save();
	}

	getFilter()
	{
		// TODO: STUB
	}

}