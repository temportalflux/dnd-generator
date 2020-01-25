import lodash from 'lodash';
import Table from './Table';
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
let TABLE_COLLECTION_CACHE = undefined;

/**
 * A collection of Tables which is loaded once at application start (or on demand after initial load).
 * This data is meant to be READONLY at runtime and does not reliably support changing or adding data.
*/
export default class TableCollection
{

	/** Event key for when the table collection is finished loading - either at app launch or user initiated. */
	static EVENT_ONCHANGED = 'onChanged';

	/** Returns the current iteration/collection of tables loaded from data. */
	static get()
	{
		return TABLE_COLLECTION_CACHE;
	}

	/**
	 * Creates a new table collection object and loads collection from data.
	*/
	static initialize()
	{
		console.log('Initializing table collection');
		TABLE_COLLECTION_CACHE = new TableCollection();
		TABLE_COLLECTION_CACHE.loadTables();
		TableCollection.dispatchEvent(TableCollection.EVENT_ONCHANGED, null, TABLE_COLLECTION_CACHE);
	}

	/**
	 * Wipes the table collection singleton and immediately reinitializes.
	*/
	static clear()
	{
		const prev = TableCollection.get();
		TABLE_COLLECTION_CACHE = null;
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

	// NOTE: `prev` is outdated
	static dispatchEvent(event, prev, next)
	{
		events.dispatchEvent(new CustomEvent(event, {
			detail: { prev, next }
		}));
	}

	constructor()
	{
		this.tables = {};
		this.npcSchema = undefined;
	}

	loadTables()
	{
		this.tables = lodash.mapValues(loadItem('/', 'index').content, Table.from);
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

	getTables()
	{
		return Object.values(this.tables);
	}

	getTable(key)
	{
		return this.tables.hasOwnProperty(key) ? this.tables[key] : undefined
	}

	getTableAtPath(keyPath)
	{
		return this.getTable(Table.getTablePathFromKeyPath(keyPath));
	}

	getTableTree()
	{
		return this.getTableKeys().reduce((accum, key) => {
			return lodash.set(accum, this.tables[key].getKeyPath() + '.table', this.tables[key]);
		}, {});
	}

}