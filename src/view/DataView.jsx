import React from 'react';
import lodash from 'lodash';
import TableCollection from '../storage/TableCollection';
import Tree from 'react-animated-tree';
import { View, Table } from '../storage/Session';
import * as queryString from 'query-string';
import DataTableView from '../components/DataTableView';

export function DataView()
{
	const urlParams = queryString.parse(window.location.search);
	if (urlParams.table !== undefined)
	{
		return <DataTableView tableKey={urlParams.table} />
	}

	function makeTreeNode([pathItem, nodeDetails])
	{
		const allNodeProperties = Object.keys(nodeDetails);
		const subNodeProperties = allNodeProperties.filter((item) => item !== 'table');
		const hasTable = allNodeProperties.includes('table');
		return (
			<Tree key={pathItem}
				content={(
					hasTable ? (
						<a href={(
							`${window.location.protocol}//${window.location.host}${window.location.pathname}?table=${nodeDetails.table.getKeyPath()}`
						)}>{pathItem}</a>
					) : (
						subNodeProperties.length > 0 ? pathItem : `Unknown: ${pathItem}`
					)
				)}
				onClick={(
					!hasTable ? undefined : () =>
					{
						View.set("data");
						Table.set(nodeDetails.table.getKeyPath());
					}
				)}
			>
				{(
					subNodeProperties.map(
						(propKey) => ([propKey, nodeDetails[propKey]])
					).map(makeTreeNode)
				)}
			</Tree>
		);
	}

	const tableCollection = TableCollection.get();
	if (tableCollection)
	{
		return (
			<Tree
				content={'Tables'}
			>
				{lodash.toPairs(tableCollection.getTableTree()).map(makeTreeNode)}
			</Tree>
		);
	}
}