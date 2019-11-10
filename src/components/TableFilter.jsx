import React, { useState } from 'react';
import { Dropdown } from 'semantic-ui-react';
import Filter from '../storage/Filter';

export function TableFilter({
	tableCollection, tableKey
})
{

	function getTable()
	{
		return tableCollection ? tableCollection.getTable(tableKey) : undefined;
	}

	const [value, setValue] = useState(Filter.get(tableKey) || []);

	function onDropdownChanged(value)
	{
		if (value.length > 0)
		{
			Filter.set(tableKey, value);
		}
		else
		{
			Filter.remove(tableKey);
		}
		setValue(value);
	}

	const table = getTable();
	return (
		<Dropdown
			fluid search selection multiple
			options={table ? table.getOptions() : []}
			value={value}
			onChange={(_, {value}) => onDropdownChanged(value)}
		/>
	);
}
