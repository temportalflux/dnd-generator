import lodash from 'lodash';
import Table from './Table';
import storage from 'local-storage';

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

export default class DataStorage
{

	static get()
	{
		const saved = storage.get('tables');
		return saved === null ? null : DataStorage.fromStorage(saved);
	}

	static clear()
	{
		const prev = DataStorage.get();
		storage.remove('tables');
		DataStorage.dispatchOnChanged(prev, null);
	}

	static addOnChanged(callback)
	{
		events.addEventListener('onChanged', callback);
	}

	static removeOnChanged(callback)
	{
		events.removeEventListener('onChanged', callback);
	}

	static dispatchOnChanged(prev, next)
	{
		events.dispatchEvent(new CustomEvent('onChanged', {
			detail: { prev, next }
		}));
	}

	static fromStorage(obj)
	{
		const data = new DataStorage();
		data.tables = lodash.mapValues(obj.tables, Table.fromStorage);
		return data;
	}

	constructor()
	{
		this.tables = {};
	}

	save()
	{
		const prev = lodash.cloneDeep(this);
		storage.set('tables', this);
		DataStorage.dispatchOnChanged(prev, this);
	}

	loadTables()
	{
		const npc = loadItem('/', 'npc');
		console.log(npc.content);

		this.tables = lodash.mapValues(loadItem('/', 'index').content, Table.from);
		console.log(this.tables);
	}

}