
class Entry
{

	static from(data)
	{
		return new Entry(data);
	}

	constructor(data)
	{
		this.weight = data.weight;
		this.key = data.key;

		this.source = data.source;

		this.value = data.value;
		this.stringify = data.stringify;

		this.children = (data.children || []).reduce((accum, childData) => {
			const child = Entry.from(childData);
			accum[child.getKey()] = child;
			return accum;
		}, {});
	}

	getKey()
	{
		return this.key;
	}

}

export default class Table
{

	// takes a json object
	static from(obj)
	{
		const entries = obj.rows.reduce((accum, entryData) => {
			const entry = Entry.from(entryData);
			accum[entry.getKey()] = entry;
			return accum;
		}, {});
		return new Table(entries);
	}

	constructor(entries)
	{
		// Map -> key/value - > entry
		this.entries = entries;
	}

}