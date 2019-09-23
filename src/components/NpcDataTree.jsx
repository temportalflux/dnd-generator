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

	convertCamelToTitleCase(text)
	{
		return text.split(/(?=[A-Z])/).map((word) => `${word[0].toUpperCase()}${word.substr(1).toLowerCase()}`).join(' ');
	}

	makeTitleText(path, data, meta)
	{
		// Convert 'thisIsAMultiWordKey' to 'The Is A Multi Word Key'
		const pathItems = path.split('.');
		const key = pathItems[pathItems.length - 1];
		const name = this.convertCamelToTitleCase(key);
		
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

	makeTreeNodeHierarchy(generatorEntry)
	{
		console.log(generatorEntry);
		return <div/>;

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

	makeTreeContents(entries)
	{
		return lodash.values(entries)
			// Prune all undefined values
			.filter((entry) => entry.hasValue())
			// Convert to hierarchy of TreeNodes
			.map(this.makeTreeNodeHierarchy);
	}

	makeTreeCategories(categoryEntryMap)
	{
		return lodash.toPairs(categoryEntryMap).map(([category, entries]) => {
			const title = this.makeTitleContent(this.convertCamelToTitleCase(category), category, false);
			return (
				<Tree
					key={category}
					content={title}
				>
					{this.makeTreeContents(entries)}
				</Tree>
			);
		});
	}

	makeDataTree(generator)
	{
		return (
			<Tree
				content={this.makeTitleContent('NPC', 'npc', true)}
				open
			>
				{this.makeTreeCategories(generator.categories)}
			</Tree>
		);
	}

	render()
	{
		return this.makeDataTree(this.props.generator);
	}

}
