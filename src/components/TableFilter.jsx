import React, { useState } from 'react';
import { Dropdown } from 'semantic-ui-react';
import Filter from '../storage/Filter';
import InputRange from 'react-input-range';
import 'react-input-range/lib/css/index.css';

// For ranges: https://github.com/davidchin/react-input-range
export function TableFilter({
	tableCollection, tableKey, storageKey
})
{

	function getTable()
	{
		return tableCollection ? tableCollection.getTable(tableKey) : undefined;
	}

	const [value, setValue] = useState(Filter.get(storageKey) || undefined);

	const table = getTable();
	if (!table) return <div />;

	function isValueAValidFilter(value)
	{
		switch (table.getFilterType())
		{
			case 'minMaxRange':
				return typeof value === 'object' && value.min && value.max;
			default:
				return Array.isArray(value) && value.length > 0;
		}
	}

	function onDropdownChanged(value)
	{
		if (isValueAValidFilter(value))
		{
			Filter.set(storageKey, value);
		}
		else
		{
			Filter.remove(storageKey);
		}
		setValue(value);
	}

	switch (table.getFilterType())
	{
		case 'minMaxRange':
			const defaultFilter = table.getDefaultFilter();
			return (
				<InputRange
					allowSameValues
					minValue={defaultFilter.min}
					maxValue={defaultFilter.max}
					value={value || defaultFilter}
					onChange={onDropdownChanged}
				/>
			);
		default:
			return (
				<Dropdown
					fluid search selection multiple
					placeholder={'No filter'}
					options={table ? table.getDefaultFilter() : []}
					value={value || []}
					onChange={(_, { value }) => onDropdownChanged(value)}
				/>
			);
	}
}
