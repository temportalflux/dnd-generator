import TableCollection from '../../storage/TableCollection';
import Filter from '../../storage/Filter';

export default function exec(tablePath, data)
{
	const tableCollection = TableCollection.get();
	const table = tableCollection.getTable(tablePath);
	return table.roll(Filter.get(tablePath), data);
}