import lodash from 'lodash';
import Table from './Table';
import storage from 'local-storage';
import NpcSchema from './NpcSchema';

function loadItem(directory, fileName)
{
	const data = require(`../data/tables${directory}${fileName}.json`);
	const isIndex = Array.isArray(data);
	let content = !isIndex ? data : data.reduce((accum, itemPath) => loadTableEntry(accum, directory, itemPath), {});
	return { content, isIndex };
}

function loadTableEntry(accumulator, directory, itemPath)
{
	const itemPathSplit = itemPath.split('/');
	const fileName = itemPathSplit.slice(-1).join('/');
	const immediateDirectory = itemPathSplit.slice(0, -1).join('/');
	const fullDirectory = `${directory}${itemPath}`.split('/').slice(0, -1).join('/') + '/';
	const item = loadItem(fullDirectory, fileName);
	if (item.isIndex)
	{
		lodash.assignIn(accumulator, lodash.mapKeys(item.content, (_, key) => `${immediateDirectory}/${key}`));
	}
	else
	{
		accumulator[itemPath] = item.content;
	}
	return accumulator;
}

const events = new EventTarget();

export default class TableCollection
{

	static EVENT_ONCHANGED = 'onChanged';

	static get()
	{
		const saved = storage.get('tables');
		return saved === null ? null : TableCollection.fromStorage(saved);
	}

	static initialize()
	{
		console.log('Initializing table collection');
		const data = new TableCollection();
		data.loadTables();
		data.save();
	}

	static clear()
	{
		const prev = TableCollection.get();
		storage.remove('tables');
		TableCollection.dispatchEvent(TableCollection.EVENT_ONCHANGED, prev, null);

		// Re-Initialize
		TableCollection.initialize();
	}

	static addEventListener(event, callback)
	{
		events.addEventListener(event, callback);
	}

	static removeEventListener(event, callback)
	{
		events.removeEventListener(event, callback);
	}

	static addOnChanged(callback)
	{
		TableCollection.addEventListener(TableCollection.EVENT_ONCHANGED, callback);
	}

	static removeOnChanged(callback)
	{
		TableCollection.removeEventListener(TableCollection.EVENT_ONCHANGED, callback);
	}

	static dispatchEvent(event, prev, next)
	{
		events.dispatchEvent(new CustomEvent(event, {
			detail: { prev, next }
		}));
	}

	static fromStorage(obj)
	{
		const data = new TableCollection();
		data.tables = lodash.mapValues(obj.tables, Table.fromStorage);
		data.npcSchema = NpcSchema.fromStorage(obj.npcSchema);
		return data;
	}

	constructor()
	{
		this.tables = {};
		this.npcSchema = undefined;
	}

	save()
	{
		const prev = lodash.cloneDeep(this);
		storage.set('tables', this);
		TableCollection.dispatchEvent(TableCollection.EVENT_ONCHANGED, prev, this);
	}

	loadTables()
	{
		this.tables = lodash.mapValues(loadItem('/', 'index').content, Table.from);
		console.log(this.tables);
		console.log('Missing Keys:', lodash.values(this.tables).reduce((accum, table) => {
			const missingKeyDatum = {};
			if (table.entriesWithoutKeys.length > 0)
			{
				missingKeyDatum.entries = table.entriesWithoutKeys;
			}
			for (let entry of lodash.values(table.entries))
			{
				if (entry.childrenWithoutKeys.length > 0)
				{
					missingKeyDatum[entry.getKey()] = entry.childrenWithoutKeys;
				}
			}
			if (Object.keys(missingKeyDatum).length > 0)
			{
				accum[table.getKey()] = missingKeyDatum;
			}
			return accum;
		}, {}))

		this.npcSchema = NpcSchema.from(loadItem('/', 'npc').content);
	}

	getNpcSchema()
	{
		return this.npcSchema;
	}

	getTableKeys()
	{
		return Object.keys(this.tables).sort();
	}

	getTable(key)
	{
		let table = null;
		do
		{
			if (table !== null && table.hasRedirector()) key = table.getRedirector();
			table = this.tables.hasOwnProperty(key) ? this.tables[key] : undefined;
		} while (table !== undefined && table.hasRedirector());
		return table;
	}

	getTableAtPath(keyPath)
	{
		return this.getTable(Table.getTablePathFromKeyPath(keyPath));
	}

	getTableTree()
	{
		return Object.keys(this.tables).reduce((accum, key) => {
			return lodash.set(accum, this.tables[key].getKeyPath() + '.table', this.tables[key]);
		}, {});
	}

}