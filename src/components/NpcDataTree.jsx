import React from 'react'
import { Grid, Button } from 'semantic-ui-react';
import Tree from 'react-animated-tree';

import lodash from 'lodash';
import inlineEval from '../generator/modules/evalAtCtx';

export default class NpcDataTree extends React.Component
{

	constructor(props)
	{
		super(props);
		this.makeStringifiedValue = this.makeStringifiedValue.bind(this);
		this.makeTitleText = this.makeTitleText.bind(this);
		this.makeTitleContent = this.makeTitleContent.bind(this);
		this.makeTreeContents = this.makeTreeContents.bind(this);
		this.makeTreeNodeHierarchy = this.makeTreeNodeHierarchy.bind(this);
		this.makeDataTree = this.makeDataTree.bind(this);
	}

	makeStringifiedValue(data, meta)
	{
		const isStructuralObject = typeof data === 'object';
		if (isStructuralObject)
		{
			if (Array.isArray(data))
			{
				return data.join(' ');
			}
			else if (meta !== undefined && meta.stringify !== undefined)
			{
				return inlineEval(meta.stringify, data);
			}
			else
			{
				return '';
			}
		}
		return `${data}`;
	}

	makeTitleText(path, data, meta)
	{
		// Convert 'thisIsAMultiWordKey' to 'The Is A Multi Word Key'
		const pathItems = path.split('.');
		const key = pathItems[pathItems.length - 1];
		const name = key.split(/(?=[A-Z])/).map((word) => `${word[0].toUpperCase()}${word.substr(1).toLowerCase()}`).join(' ');
		
		if (meta !== undefined && meta.hideInlineValue) return name;
		
		const stringifiedValue = this.makeStringifiedValue(data, meta);
		if (stringifiedValue) return `${name}: ${stringifiedValue}`;

		return name;
	}

	makeTitleContent(title, path, canReroll)
	{
		return (
			<span>
				{title} {canReroll && <Button path={path} size='mini' icon='refresh' onClick={this.props.onRerollClicked} />}
			</span>
		);
	}

	makeTreeNodeHierarchy(path, data, meta, canParentReroll)
	{
		const isStructuralObject = typeof data === 'object';
		const isTrueObject = isStructuralObject && !Array.isArray(data);

		const canReroll = canParentReroll && (meta === undefined || meta.canReroll === undefined || meta.canReroll !== false);
		const title = this.makeTitleContent(this.makeTitleText(path, data, meta), path, canReroll);

		if (isTrueObject)
		{
			return (
				<Tree
					key={path}
					content={title}
				>
					{this.makeTreeContents(path, data, meta, canReroll)}
				</Tree>
			);
		}
		else
		{
			return (
				<Tree
					key={path}
					content={title}
				/>
			);
		}
	}

	makeTreeContents(path, data, meta, canParentReroll)
	{
		return lodash.toPairs(data)
			// Prune all undefined values
			.filter(([vk, v]) => v !== undefined)
			// Convert to hierarchy of TreeNodes
			.map(([valueKey, value]) => this.makeTreeNodeHierarchy(
				`${path !== undefined ? `${path}.` : ''}${valueKey}`, 
				value,
				meta === undefined ? undefined : meta[valueKey],
				canParentReroll
			));
	}

	makeDataTree(data)
	{
		const canReroll = true;
		return (
			<Tree
				content={this.makeTitleContent('NPC', 'npc', canReroll)}
				open
			>
				{this.makeTreeContents(undefined, data.values, data.meta, canReroll)}
			</Tree>
		);
	}

	render()
	{
		return this.makeDataTree(this.props.data);
	}

}
