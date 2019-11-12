import TableCollection from './storage/TableCollection';

export function getTable(tablePath)
{
	return TableCollection.get().getTable(tablePath);
	//return require(`./data/tables/${tablePath}.json`);
}
