import React from 'react'
import { Grid, Button, Popup } from 'semantic-ui-react';
import Tree from 'react-animated-tree';
import {Generator} from '../generator/Generator';
import GenerationEntryPopup from './GenerationEntryPopup';

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

	makeTitleText(generatorEntry)
	{
		const name = generatorEntry.getName();
		if (generatorEntry.hideInlineValue) return name;
		
		const stringifiedValue = generatorEntry.toString();
		if (stringifiedValue) return `${name}: ${stringifiedValue}`;

		return name;
	}

	makeTitleContent(title, path, canReroll, popupComponent)
	{
		const titleOrPopup = popupComponent !== undefined
			? (
				<Popup
					trigger={(
						<span>
							{title}
						</span>
					)}
					content={popupComponent}
			/>)
			: title;
		return (
			<span>
				{canReroll && <Button path={path} size='mini' icon='refresh' onClick={this.props.onRerollClicked} />} {titleOrPopup}
			</span>
		);
	}

	makeTreeNodeHierarchy(generatorEntry)
	{
		const title = this.makeTitleContent(
			this.makeTitleText(generatorEntry),
			generatorEntry.getPath(),
			generatorEntry.getCanReroll(),
			(<GenerationEntryPopup entry={generatorEntry} />)
		);

		if (generatorEntry.hasChildren())
		{
			return (
				<Tree
					content={title}
					key={generatorEntry.getKey()}
				>
					{this.makeTreeContents(generatorEntry.getChildren())}
				</Tree>
			);
		}
		else
		{
			return (
				<Tree
					content={title}
					key={generatorEntry.getKey()}
				/>
			);
		}
	}

	makeTreeContents(entryMap)
	{
		return lodash.sortBy(lodash.values(entryMap), (e) => e.key).map(this.makeTreeNodeHierarchy);
	}

	makeTreeCategories(categoryEntryMap)
	{
		return lodash.toPairs(categoryEntryMap).map(([category, entries]) => {
			const title = this.makeTitleContent(
				Generator.convertCamelToTitleCase(category),
				category,
				lodash.values(entries).reduce((canRerollAny, entry) => canRerollAny || entry.getCanReroll(), false)
			);
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
