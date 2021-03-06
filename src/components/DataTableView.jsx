import React from 'react';
import TableCollection from '../storage/TableCollection';
import {useTable} from 'react-table';
import { Table, Header, Container } from 'semantic-ui-react';
import * as DataTable from '../storage/Table';

function getDataTable(tableKey)
{
	const tableCollection = TableCollection.get();
	if (!tableCollection) { return undefined; }
	return tableKey !== undefined ? tableCollection.getTableAtPath(tableKey) : undefined;
}

// ReactHooks: https://reactjs.org/docs/hooks-effect.html
// Memos: https://reactjs.org/docs/hooks-reference.html#usememo
export default function DataTableView({ tableKey })
{
	const dataTable = getDataTable(tableKey);
	
	const columns = React.useMemo(() => DataTable.default.COLUMNS, []);

	const [rowCount, setRowCount] = React.useState(dataTable === undefined ? 0 : dataTable.length());
	React.useEffect(() => {

		if (dataTable === undefined) { return; }

		function onChangedRowCount({ details })
		{
			setRowCount(details.next);
		}

		dataTable.subscribeOnChangedRowCount(onChangedRowCount);

		return () => {
			dataTable.unsubscribeOnChangedRowCount(onChangedRowCount);
		};
	});

	const data = React.useMemo(() => {
		const table = getDataTable(tableKey);
		if (table === undefined) { return []; }
		return table.getRows();
	}, [tableKey]);

	// React-Table API: https://github.com/tannerlinsley/react-table/blob/master/docs/api.md#usetable
	// React-Table Examples: https://github.com/tannerlinsley/react-table/blob/master/docs/examples.md
	const {
		getTableProps,
		getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
	} = useTable({
		columns, data,
	});

	if (dataTable === undefined)
	{
		return (
			<Header>
				403: No table found
			</Header>
		);
	}

	return (
		<Container>
			<Header>{dataTable.getKey()} ({rowCount} rows)</Header>
			<Table {...getTableProps()}>
				<Table.Header>
					{headerGroups.map((headerGroup) => (
						<Table.Row {...headerGroup.getHeaderGroupProps()}>
							{headerGroup.headers.map((column) => (
								<Table.HeaderCell {...column.getHeaderProps()}>
									{column.render('Header')}
								</Table.HeaderCell>
							))}
						</Table.Row>
					))}
				</Table.Header>
				<Table.Body {...getTableBodyProps()}>
					{rows.map((row, i) => prepareRow(row) || (
						<Table.Row {...row.getRowProps()}>
							{row.cells.map(cell => {
								return (
									<Table.Cell {...cell.getCellProps()}>
										{cell.render('Cell')}
									</Table.Cell>
								);
							})}
						</Table.Row>
					))}
				</Table.Body>
			</Table>
		</Container>
	);
}

/*
export class DataTableView extends React.Component
{
	getTableData()
	{
		const tableCollection = TableCollection.get();
		if (!tableCollection) { return undefined; }
		const tableKey = this.props.tableKey;
		return tableKey !== undefined ? tableCollection.getTable(tableKey) : undefined;
	}

	render()
	{
		console.log(DataTable.default.COLUMNS);
		return 'T2';
		console.log(COLUMNS);

		const tableData = this.getTableData();
		if (tableData === undefined)
		{
		}

		console.log(tableData);

	}

}
		//*/
