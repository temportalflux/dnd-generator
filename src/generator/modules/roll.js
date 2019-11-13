import TableCollection from '../../storage/TableCollection';

export default function exec(tablePath, data)
{
	const table = TableCollection.get().getTable(tablePath);
	if (!table)
	{
		//console.error(`Could not find table for path ${tablePath}`);
		return undefined;
	}
	return table.roll(data.filter, data);
}