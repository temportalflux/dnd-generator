import React, { useState, useEffect } from 'react';
import TableCollection from '../storage/TableCollection';
import storage from 'local-storage';
import { Dropdown } from 'semantic-ui-react';

export function TableFilter({tableKey})
{

	function getFilterStorageKey()
	{
		return `filters.${tableKey}`;
	}

	function getTable()
	{
		const tableCollection = TableCollection.get();
		return tableCollection ? tableCollection.getTable(tableKey) : undefined;
	}

	const [value, setValue] = useState(storage.get(getFilterStorageKey()));

	function onDropdownChanged(value)
	{
		if (value.length > 0)
		{
			storage.set(getFilterStorageKey(), value);
		}
		else
		{
			storage.remove(getFilterStorageKey());
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
