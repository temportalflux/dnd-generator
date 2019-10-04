import lodash from 'lodash';
import {inlineEval, VARIABLE_REGEX} from './modules/evalAtCtx';
import parser from './parser';
import appendModifiers from './appendModifiers';

export class GenerationEntry
{

	constructor(data)
	{
		{
			this.deconstruct = this.deconstruct.bind(this);
			this.getCategory = this.getCategory.bind(this);
			this.getKey = this.getKey.bind(this);
			this.getPath = this.getPath.bind(this);
			this.isValid = this.isValid.bind(this);
			this.getName = this.getName.bind(this);
			this.getLocalContext = this.getLocalContext.bind(this);
			this.getGlobalContext = this.getGlobalContext.bind(this);
			this.getAllContext = this.getAllContext.bind(this);
			this.makeString = this.makeString.bind(this);
			this.updateString = this.updateString.bind(this);
			this.toString = this.toString.bind(this);
			this.getCanReroll = this.getCanReroll.bind(this);
			this.clearChildren = this.clearChildren.bind(this);
			this.createChildren = this.createChildren.bind(this);
			this.createEntry = this.createEntry.bind(this);
			this.addChild = this.addChild.bind(this);
			this.setParent = this.setParent.bind(this);
			this.hasChildren = this.hasChildren.bind(this);
			this.getChildren = this.getChildren.bind(this);
			this.getChild = this.getChild.bind(this);
			this.getLineageValues = this.getLineageValues.bind(this);
			this.hasDependencies = this.hasDependencies.bind(this);
			this.getDependencies = this.getDependencies.bind(this);
			this.subscribeDependencies = this.subscribeDependencies.bind(this);
			this.unsubscribeDependencies = this.unsubscribeDependencies.bind(this);
			this.addAffectedEntry = this.addAffectedEntry.bind(this);
			this.removeAffectedEntry = this.removeAffectedEntry.bind(this);
			this.getAllAffectedEntryPaths = this.getAllAffectedEntryPaths.bind(this);
			this.subscribeToCollection = this.subscribeToCollection.bind(this);
			this.unsubscribeFromCollection = this.unsubscribeFromCollection.bind(this);
			this.subscribeAsCollectionEntry = this.subscribeAsCollectionEntry.bind(this);
			this.unsubscribeAsCollectionEntry = this.unsubscribeAsCollectionEntry.bind(this);
			this.hasCollectionEntries = this.hasCollectionEntries.bind(this);
			this.getCollectionEntries = this.getCollectionEntries.bind(this);
			this.generate = this.generate.bind(this);
			this.getValue = this.getValue.bind(this);
			this.modify = this.modify.bind(this);
			this.subscribeModifiers = this.subscribeModifiers.bind(this);
			this.unsubscribeModifiers = this.unsubscribeModifiers.bind(this);
			this.subscribeModifyingEntry = this.subscribeModifyingEntry.bind(this);
			this.unsubscribeModifyingEntry = this.unsubscribeModifyingEntry.bind(this);
			this.modifyEntryValue = this.modifyEntryValue.bind(this);
			this.applyModifier = this.applyModifier.bind(this);
		}

		lodash.assign(this, {
			generator: null,

			// CORE DATA
			category: undefined,
			// entry is invalid if key is not defined
			key: undefined,
			name: undefined,
			description: undefined,
			source: undefined,
			// if value is a number, then this is the lowest possible value
			minimum: undefined,

			// GENERATION OUTPUT
			value: undefined,
			// a dict of entry keys to modifications of those entries
			modifiers: {},

			// LINEAGE
			parent: null,
			childrenAreGenerated: false,
			children: [],

			// METADATA
			stringify: undefined,
			canReroll: true,
			// entry keys that cause regeneration of this entry
			dependencies: [],
			// an entry key to another entry whose value is an array that this value contributes to
			collection: undefined,

			// DYNAMIC
			// entry keys which have modifiers for this entry. Generated from `modifiers`
			modifiedBy: [],
			usedInStringifyBy: [],
			// entry keys which this value causes regeneration for. Generated from `dependencies`
			affects: [],
			// entry keys which have marked themselves as a part of this collection. Only used if value is an array.
			collectionEntries: [],
		}, data);

		this.createChildren();

		this.stringified = undefined;
	}

	deconstruct()
	{
		this.unsubscribeDependencies();
		this.unsubscribeModifiers();
		this.unsubscribeFromCollection();
		this.clearChildren();
	}

	getCategory()
	{
		return this.parent === null ? this.category : this.parent.getCategory();
	}

	getKey()
	{
		return this.parent !== null ? `${this.parent.key}.${this.key}` : this.key;
	}

	getPath()
	{
		return this.parent !== null ? `${this.parent.getPath()}.${this.key}` : `${this.category ? `${this.category}.` : ''}${this.key}`;
	}

	isValid()
	{
		return this.key !== undefined;
	}

	getName()
	{
		if (this.name !== undefined) return this.name;
		const path = lodash.toPath(this.getKey());
		return path[path.length - 1]
			.split(/(?=[A-Z])/)
			.map(
				(word) => `${word[0].toUpperCase()}${word.substr(1).toLowerCase()}`
			).join(' ');
	}

	getLocalContext()
	{
		const value = this.getValue();

		const lineageValues = this.getLineageValues();
		const localizedValues = lodash.get(lineageValues, this.getPath());
		const isValueAnObject = (v) => typeof v === 'object' && !Array.isArray(v);

		let context = {};
		if (isValueAnObject(localizedValues))
			context = lodash.assign(context, localizedValues);
		if (value !== undefined)
			context = lodash.assign(context, isValueAnObject(value) ? value : { value: value });

		return context;
	}

	getGlobalContext()
	{
		return this.generator.getAllValues();
	}

	getAllContext()
	{
		return lodash.assign({}, this.getGlobalContext(), this.getLocalContext());
	}

	getStringifyDependencies()
	{
		if (this.stringify === undefined) return [];
		const allMatches = Array.from(this.stringify.matchAll(VARIABLE_REGEX));
		const allVariableReplacements = allMatches.map((match) => match[1]);
		const variableStringOnlyRegex = /^[a-zA-Z0-9]+\.[a-zA-Z0-9\.]+$/g;
		const allNonlineageReplacements = allVariableReplacements.filter((key) => variableStringOnlyRegex.test(key));
		return allNonlineageReplacements;
	}

	makeString(value)
	{
		value = value || this.getValue();
		if (this.stringify !== undefined)
		{
			const allContext = this.getAllContext();
			const asString = inlineEval(this.stringify, allContext);
			return asString === undefined ? value : asString;
		}
		else if (this.description !== undefined)
		{
			return this.description;
		}
		else if (Array.isArray(value))
		{
			return value.join(' ');
		}
		return `${value}`;
	}

	updateString(value)
	{
		this.stringified = this.makeString(value);

		if (this.parent !== null)
		{
			this.parent.updateString();
		}

		const allAffectedStrings = lodash.uniq(Object.keys(this.modifiers).concat(this.usedInStringifyBy));

		allAffectedStrings.forEach((entryKey) =>
		{
			const entry = this.generator.getEntry(entryKey);
			if (entry !== undefined)
			{
				entry.updateString();
			}
		});

	}

	subscribeToStringReplacements()
	{
		this.getStringifyDependencies().forEach((path) =>
		{
			const entry = this.generator.getEntry(path);
			if (entry)
			{
				entry.subscribeStringifyDependency(this);
			}
		});
	}

	unsubscribeFromStringReplacements()
	{
		this.getStringifyDependencies().forEach((path) =>
		{
			const entry = this.generator.getEntry(path);
			if (entry)
			{
				entry.unsubscribeStringifyDependency(this);
			}
		});
	}

	subscribeStringifyDependency(entry)
	{
		this.usedInStringifyBy.push(entry.getPath());
		this.usedInStringifyBy = lodash.uniq(this.usedInStringifyBy);
	}

	unsubscribeStringifyDependency(entry)
	{
		const entryKey = entry.getPath();
		this.usedInStringifyBy = this.usedInStringifyBy.filter((key) => key !== entryKey);
	}

	toString()
	{
		return this.stringified;
	}

	getCanReroll()
	{
		return (
			this.canReroll === undefined || this.canReroll === true
		) && (this.parent === null || this.parent.getCanReroll());
	}

	clearChildren()
	{
		Object.keys(this.children).forEach((childKey) =>
		{
			this.children[childKey].deconstruct();
		});
		this.children = {};
	}

	createChildren()
	{
		const childrenData = lodash.cloneDeep(this.children);
		this.children = {};
		childrenData.forEach((entryData) => this.addChild(this.createEntry(entryData)));
	}

	createEntry(entryData)
	{
		return new GenerationEntry(lodash.assign({}, entryData, { generator: this.generator }));
	}

	addChild(child)
	{
		child.setParent(this);
		this.children[child.key] = this.generator.addEntry(child);
	}

	setParent(parent)
	{
		this.parent = parent;
	}

	hasChildren()
	{
		return Object.keys(this.children).length > 0;
	}

	getChildren()
	{
		return this.children || {};
	}

	getChild(subpath)
	{
		const { items, remaining } = Generator.sever(subpath);
		const children = this.getChildren();
		if (children.hasOwnProperty(items[0]))
		{
			const child = children[items[0]];
			return remaining.length > 0 ? child.getChild(remaining) : child;
		}
		else if (lodash.has(this.value, subpath))
		{
			return this;
		}
		else
		{
			console.warn(`Could not find entry with subpath ${subpath} under entry ${this.getPath()}`);
			return undefined;
		}
	}

	getLineageValues(values)
	{
		values = values || {};

		const hasChildren = this.hasChildren();

		const localValue = this.getValue();
		if (localValue !== undefined)
		{
			const valueLocation = hasChildren ? `${this.getPath()}.value` : this.getPath();
			lodash.set(values, valueLocation, localValue);
		}

		lodash.set(values, `${this.getPath()}String`, this.toString());
		
		if (hasChildren)
		{
			lodash.values(this.getChildren()).forEach(
				(child) => child.getLineageValues(values)
			);
		}

		return values;
	}

	hasDependencies()
	{
		return this.dependencies.length > 0;
	}

	getDependencies()
	{
		return this.dependencies.sort();
	}

	subscribeDependencies()
	{
		if (this.hasDependencies())
		{
			for (const dependencyKey of this.getDependencies())
			{
				if (!this.generator.hasEntry(dependencyKey))
				{
					console.warn(`Cannot create dependency from '${this.getPath()}' on '${dependencyKey}', there is no entry for '${dependencyKey}'.`);
					continue;
				}
				this.generator.getEntry(dependencyKey).addAffectedEntry(this);
			}
		}
	}

	unsubscribeDependencies()
	{
		if (this.hasDependencies())
		{
			for (const dependencyKey of this.getDependencies())
			{
				if (!this.generator.hasEntry(dependencyKey))
				{
					console.warn(`Cannot remove dependency for '${this.getPath()}' from '${dependencyKey}', there is no entry for '${dependencyKey}'.`);
					continue;
				}
				this.generator.getEntry(dependencyKey).removeAffectedEntry(this);
			}
		}
	}

	addAffectedEntry(entry)
	{
		this.affects.push(entry.getPath());
	}

	removeAffectedEntry(entry)
	{
		const entryKey = entry.getPath();
		this.affects = this.affects.filter((key) => key !== entryKey);
	}

	getAllAffectedEntryPaths()
	{
		return lodash.values(this.children).map((child) => child.getPath()).concat(this.affects).sort();
	}

	subscribeToCollection()
	{
		if (this.collection === undefined) return;
		const entry = this.generator.getEntry(this.collection);
		if (entry)
		{
			entry.subscribeAsCollectionEntry(this);
		}
	}

	unsubscribeFromCollection()
	{
		if (this.collection === undefined) return;
		const entry = this.generator.getEntry(this.collection);
		if (entry)
		{
			entry.unsubscribeAsCollectionEntry(this);
		}
	}

	subscribeAsCollectionEntry(entry)
	{
		this.collectionEntries.push(entry.getPath());
	}

	unsubscribeAsCollectionEntry(entry)
	{
		const entryKey = entry.getPath();
		this.collectionEntries = this.collectionEntries.filter((key) => key !== entryKey);
	}

	hasCollectionEntries()
	{
		return this.collectionEntries.length > 0;
	}

	getCollectionEntries()
	{
		return this.collectionEntries.sort();
	}

	generate(data, layer = 0)
	{
		if (layer > 0)
		{
			//console.log(`Generating secondary generation for ${this.source}/${this.value}`);
		}

		if (this.source === undefined)
		{
			this.updateString();
			return;
		}

		if (this.dependencies)
		{
			for (const dependencyKey of this.dependencies)
			{
				if (!lodash.has(data, dependencyKey) || lodash.get(data, dependencyKey) === undefined)
				{
					console.warn(`Failed to generate ${this.getPath()}. Missing dependency ${dependencyKey} in`, lodash.cloneDeep(data));
					return;
				}
			}
		}

		if (this.childrenAreGenerated)
		{
			this.clearChildren();
		}

		if (this.isValid())
		{
			this.unsubscribeModifiers();
			this.unsubscribeFromCollection();
			this.unsubscribeFromStringReplacements();
		}

		// Parser could return an undefined value if the command didn't work.
		// For example, a table like 'beard' is assumed to have an entry for every race,
		// so races can opt-in by defining a beard.json table. If one is missing, this is not an error,
		// but rather the race opting-out of generating beard data.
		const result = parser(this.source, data);
		if (typeof result === 'object' && !Array.isArray(result))
		{
			const entry = this.createEntry(result);
			if (!entry.isValid())
			{
				let entryModifiers = appendModifiers({}, lodash.cloneDeep(entry.modifiers));
				entry.modifiers = {};

				entry.generate(data, layer + 1);
				this.value = entry.getValue();

				if (entry.stringify !== undefined)
					this.stringify = entry.stringify;
				this.description = entry.description;

				// copy over secondary generation modifiers
				entryModifiers = appendModifiers(entryModifiers, lodash.cloneDeep(entry.modifiers));
				entry.modifiers = {};

				this.modifiers = entryModifiers;

				if (entry.hasChildren())
				{
					if (this.hasChildren())
					{
						console.error('Entry', lodash.cloneDeep(this), `has children, but has also generated a value with children`, lodash.cloneDeep(entry));
					}
					else
					{
						this.childrenAreGenerated = true;
						this.children = lodash.mapValues(entry.children, (child) =>
						{
							child.setParent(this);
							return child;
						});
					}
				}
			}
			else
			{
				console.error('Generated result has a value for the "key" property. This is not okay.');
			}
		}
		else
		{
			this.value = result;
		}

		if (this.isValid())
		{
			this.subscribeModifiers();
			this.subscribeToCollection();
			this.subscribeToStringReplacements();
			this.updateString();
		}

	}

	getValue()
	{
		let modifiedValue = this.modify(this.value);
		if (typeof this.minimum === 'number' && typeof this.value === 'number')
			modifiedValue = Math.max(modifiedValue, this.minimum);
		return modifiedValue;
	}

	modify(value)
	{
		const path = this.getPath();
		return this.modifiedBy.reduce((modifiedValue, entryKey) =>
		{
			const entry = this.generator.getEntry(entryKey);
			return entry === undefined ? modifiedValue : entry.modifyEntryValue(path, modifiedValue);
		}, value);
	}

	subscribeModifiers()
	{
		Object.keys(this.modifiers).forEach((path) =>
		{
			const entry = this.generator.getEntry(path);
			if (entry)
			{
				entry.subscribeModifyingEntry(this);
			}
		});
	}

	unsubscribeModifiers()
	{
		Object.keys(this.modifiers).forEach((path) =>
		{
			const entry = this.generator.getEntry(path);
			if (entry)
			{
				entry.unsubscribeModifyingEntry(this);
			}
		});
	}

	subscribeModifyingEntry(entry)
	{
		this.modifiedBy.push(entry.getPath());
	}

	unsubscribeModifyingEntry(entry)
	{
		const entryKey = entry.getPath();
		this.modifiedBy = this.modifiedBy.filter((key) => key !== entryKey);
	}

	modifyEntryValue(keyToModify, value)
	{
		return this.applyModifier(this.modifiers[keyToModify], value);
	}

	applyModifier(modToEval, value)
	{
		if (modToEval === undefined) return value;
		else if (Array.isArray(modToEval))
		{
			return modToEval.reduce((accum, mod) => this.applyModifier(mod, accum), value);
		}
		else if (typeof value === 'number')
		{
			if (typeof modToEval === 'number') return value + modToEval;
			else if (typeof modToEval === 'string')
			{
				// dont pass data to modifier evals, currently not required
				const modifier = inlineEval(modToEval, this.getLocalContext());
				return modifier !== undefined ? value + parseInt(modifier, 10) : value;
			}
			else if (typeof modToEval === 'object')
			{
				switch (modToEval.type)
				{
					case 'curve':
						switch (modToEval.curve)
						{
							case 'step':
								{
									const keyframes = Object.keys(modToEval.values);
									let currentIndex = undefined;
									let nextIndex = keyframes.length > 0 ? 0 : undefined;
									while (nextIndex !== undefined
										&& parseInt(this.value, 10) > parseInt(keyframes[nextIndex], 10))
									{
										currentIndex = nextIndex;
										nextIndex++;
										if (nextIndex >= keyframes.length) nextIndex = undefined;
									}
									return value + (currentIndex ? modToEval.values[keyframes[currentIndex]] : 0);
								}
							case 'lerp':
								{
									const valueInt = parseInt(this.value, 10);

									const keyframes = Object.keys(modToEval.values);
									const getInt = (i) => parseInt(keyframes[i], 10);
									let lowerIndex = undefined;
									let higherIndex = keyframes.length > 0 ? 0 : undefined;
									while (higherIndex !== undefined
										&& valueInt > getInt(higherIndex))
									{
										lowerIndex = higherIndex;
										higherIndex++;
										if (higherIndex >= keyframes.length) higherIndex = undefined;
									}

									if (lowerIndex === undefined)
									{
										lowerIndex = higherIndex;
									}
									else if (higherIndex === undefined)
									{
										higherIndex = lowerIndex;
									}

									const lowerInput = getInt(lowerIndex);
									const higherInput = getInt(higherIndex);
									const lowerMod = modToEval.values[keyframes[lowerIndex]];
									const higherMod = modToEval.values[keyframes[higherIndex]];

									const t = (valueInt - lowerInput) / (higherInput !== lowerInput ? higherInput - lowerInput : higherInput);
									const lerped = (1 - t) * lowerMod + (t * higherMod);

									if (modToEval.toIntOp === undefined) return lerped;
									const intOp = Math[modToEval.toIntOp];
									if (intOp === undefined)
									{
										console.warn('Encountered unimplemented curve int cast operator:', modToEval.toIntOp);
										return value;
									}
									else
									{
										return value + intOp(lerped);
									}
								}
							default:
								break;
						}
						break;
						case 'multiply':
						{
							const multiplier = inlineEval(modToEval.value, this.getLocalContext());
							if (multiplier === undefined) return value;
							return value * parseInt(parser(multiplier, {}), 10);
						}
						case 'multiplyAdd':
						{
							const multiplier = inlineEval(modToEval.multiply, this.getLocalContext());
							const adder = inlineEval(modToEval.add, this.getLocalContext());
							if (multiplier === undefined || adder === undefined) return value;
							return value * parseInt(multiplier, 10) + parseInt(adder, 10);
						}
					default:
						break;
				}
			}
		}
		else if (Array.isArray(value))
		{
			if (typeof modToEval === 'object')
			{
				switch (modToEval.type)
				{
					case 'append':
					{
						const valueToAppend = inlineEval(modToEval.value, this.getLocalContext());
						if (valueToAppend === undefined) return value;
						return lodash.cloneDeep(value).concat(valueToAppend);
					}
					default:
						break;
				}
			}
		}
		else if (typeof value === 'string' && typeof modToEval === 'string')
		{
			return modToEval;
		}

		console.warn('Encountered unimplemented modifier schema:', modToEval);
		return value;
	}

}

export class Generator
{

	static convertCamelToTitleCase(text)
	{
		return text.split(/(?=[A-Z])/).map((word) => `${word[0].toUpperCase()}${word.substr(1).toLowerCase()}`).join(' ');
	}

	static sever(fullKey, itemCount = 1)
	{
		const path = lodash.toPath(fullKey);
		return {
			items: path.slice(0, itemCount),
			remaining: path.slice(itemCount).join('.'),
		};
	}

	constructor()
	{
		this.hasCategory = this.hasCategory.bind(this);
		this.addEntry = this.addEntry.bind(this);
		this.getEntry = this.getEntry.bind(this);
		this.hasEntry = this.hasEntry.bind(this);
		this.forAllEntries = this.forAllEntries.bind(this);
		this.getAllValues = this.getAllValues.bind(this);
		this.setGenerationOrder = this.setGenerationOrder.bind(this);
		this.generate = this.generate.bind(this);
		this.regenerate = this.regenerate.bind(this);

		this.categories = {};
		this.generationOrder = [];
	}

	hasCategory(category)
	{
		return this.categories.hasOwnProperty(category);
	}

	addEntry(entry)
	{

		entry.subscribeDependencies();

		if (entry.category)
		{
			if (!this.hasCategory(entry.category))
			{
				this.categories[entry.category] = {};
			}
			this.categories[entry.category][entry.key] = entry;
		}
		return entry;
	}

	getEntry(fullKey)
	{
		const { items, remaining } = Generator.sever(fullKey, 2);
		const entry = this.categories[items[0]][items[1]];
		return remaining.length > 0 ? entry.getChild(remaining) : entry;
	}

	hasEntry(fullKey)
	{
		return this.getEntry(fullKey) !== undefined;
	}

	forAllEntries(loop)
	{
		lodash.values(this.categories).forEach(
			(entryMap) => lodash.values(entryMap).forEach(loop)
		);
	}

	getAllValues()
	{
		const values = {}
		this.forAllEntries((entry) => entry.getLineageValues(values));
		return values;
	}

	setGenerationOrder(order)
	{
		this.generationOrder = order;
	}

	generate()
	{
		for (let key of this.generationOrder)
		{
			this.regenerate(key);
		}
	}

	// causes a generation of the entry at key
	regenerate(path, bGenerateDependencies = true)
	{
		if (this.hasCategory(path))
		{
			// TODO: Categories need to generate in a specific order
			lodash.values(this.categories[path]).forEach((entry) => this.regenerate(entry.getPath(), bGenerateDependencies));
			return;
		}

		if (!this.hasEntry(path))
		{
			throw new Error(`Missing entry '${path}', please add it via 'addEntry'.`);
		}

		const allData = this.getAllValues();

		const entry = this.getEntry(path);

		entry.generate(allData);

		if (bGenerateDependencies)
		{
			entry.getAllAffectedEntryPaths().forEach((affectedEntryPath) => this.regenerate(affectedEntryPath, true));
		}

	}

}