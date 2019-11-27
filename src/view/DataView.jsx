import React from 'react';
import lodash from 'lodash';
import { Link, useRoutes } from 'raviger';
import DataTableView from '../components/DataTableView';
import TableCollection from '../storage/TableCollection';
import Tree from 'react-animated-tree';

export function DataView({ basePath })
{
	const tableCollection = TableCollection.get();
	const routes = (tableCollection ? tableCollection.getTables() : [])
		.reduce((routes, table) => {
			routes[`/${table.getKeyPath()}`] = () => <DataTableView tableKey={table.getKey()} />;
			return routes;
		}, {});
	const route = useRoutes(routes, { basePath: basePath });
	if (route) return route;

	function makeTreeNode([pathItem, nodeDetails])
	{
		const allNodeProperties = Object.keys(nodeDetails);
		const subNodeProperties = allNodeProperties.filter((item) => item !== 'table');
		const hasTable = allNodeProperties.includes('table');
		const content = !hasTable ? pathItem : (
			<span>
				<Link href={`${basePath}/${nodeDetails.table.getKeyPath()}`}>{pathItem}</Link>
			</span>
		);
		if (subNodeProperties.length === 0)
		{
			if (hasTable)
			{
				// Just a leaf for an actual table
				return (
					<Tree key={pathItem}
						content={content}
					/>
				);
			}
			return <Tree key={pathItem} content={`Unknown: ${pathItem}`} />;
		}
		else
		{
			const subnodes = subNodeProperties.reduce((accum, propKey) => {
				accum[propKey] = nodeDetails[propKey];
				return accum;
			}, {});
			return (
				<Tree key={pathItem} content={content} >
					{lodash.toPairs(subnodes).map(makeTreeNode)}
				</Tree>
			);
		}
	}

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