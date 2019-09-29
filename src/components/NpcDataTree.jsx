import React from 'react'
import { Header, Button, Popup } from 'semantic-ui-react';
import Tree from 'react-animated-tree';
import { Generator } from '../generator/Generator';
import GenerationEntryPopup from './GenerationEntryPopup';

import lodash from 'lodash';

export default class NpcDataTree extends React.Component
{

	constructor(props)
	{
		super(props);
		this.makeTitleText = this.makeTitleText.bind(this);
		this.makeTitleContent = this.makeTitleContent.bind(this);
		this.makeTreeContents = this.makeTreeContents.bind(this);
		this.makeTreeNodeHierarchy = this.makeTreeNodeHierarchy.bind(this);
		this.makeDataTree = this.makeDataTree.bind(this);
	}

	makeTitleText(generatorEntry)
	{
		const name = generatorEntry.getName();
		if (generatorEntry.hideInlineValue) return name;

		const stringifiedValue = generatorEntry.toString();
		if (stringifiedValue) return `${name}: ${stringifiedValue}`;

		return name;
	}

	createPopup(text, component)
	{
		return (
			<Popup
				trigger={(
					<span>
						{text}
					</span>
				)}
				content={component}
			/>
		);
	}

	makeTitleContent(title, path, canReroll, popupComponent)
	{
		const titleOrPopup = popupComponent !== undefined
			? this.createPopup(title, popupComponent)
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

		//const value = generatorEntry.getValue();

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
		else if (generatorEntry.hasCollectionEntries())
		{
			return (
				<Tree
					content={title}
					key={generatorEntry.getKey()}
				>
					{generatorEntry.getCollectionEntries()
						.filter(generatorEntry.generator.hasEntry)
						.filter((entryPath) => generatorEntry.generator.getEntry(entryPath).toString() !== 'none')
						.map((entryPath) => (
							<Tree
								key={entryPath}
								content={this.createPopup(
									generatorEntry.generator.getEntry(entryPath).toString(),
									(
										<div>
											<Header as='h5'>Path</Header>
											{entryPath}
										</div>
									)
								)}
							/>
						))}
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
		return lodash.toPairs(categoryEntryMap).map(([category, entries]) =>
		{
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
