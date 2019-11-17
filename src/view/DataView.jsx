import React from 'react';
import lodash from 'lodash';
import { ViewContainer } from './ViewContainer';
import DataTableView from '../components/DataTableView';
import TableCollection from '../storage/TableCollection';
import Tree from 'react-animated-tree';
import { Link } from 'react-router-dom';

export class DataView extends React.Component
{

	getTableKey()
	{
		return this.props.match.params.table;
	}

	hasTableKey()
	{
		return this.getTableKey() !== undefined;
	}

	render()
	{
		return (
			<ViewContainer page={this.props.location.pathname}>
				{this.renderContent()}
			</ViewContainer>
		);
	}

	renderContent()
	{
		if (!this.hasTableKey())
		{
			function makeTreeNode([pathItem, nodeDetails])
			{
				const allNodeProperties = Object.keys(nodeDetails);
				const subNodeProperties = allNodeProperties.filter((item) => item !== 'table');
				const hasTable = allNodeProperties.includes('table');
				const content = !hasTable ? pathItem : (
					<span>
						<Link to={`data/${nodeDetails.table.getKeyPath()}`}>{pathItem}</Link>
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
		return (
			<DataTableView tableKey={this.getTableKey()} />
		);
	}

}