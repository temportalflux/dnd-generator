import lodash from 'lodash';
import inlineEval from './modules/evalAtCtx';
import parser from './parser';
import appendModifiers from './appendModifiers';

export class GenerationEntry
{

	constructor(data)
	{
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

			// DYNAMIC
			// entry keys which have modifiers for this entry. Generated from `modifiers`
			modifiedBy: [],
			// entry keys which this value causes regeneration for. Generated from `dependencies`
			affects: [],
		}, data);
		this.createChildren();
	}

	deconstruct()
	{
		this.unsubscribeDependencies();
		this.unsubscribeModifiers();
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

	toString()
	{
		const value = this.getValue();
		if (this.stringify !== undefined)
		{
			const allContext = lodash.assign({}, this.generator.getAllValues(), this.getLocalContext());
			return inlineEval(this.stringify, allContext);
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

	getCanReroll()
	{
		return (
			this.canReroll === undefined || this.canReroll === true
		) && (this.parent === null || this.parent.getCanReroll());
	}

	clearChildren()
	{
		Object.keys(this.children).forEach((childKey) => {
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
		else return undefined;
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
		return this.dependencies;
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
		return lodash.values(this.children).map((child) => child.getPath()).concat(this.affects);
	}

	generate(data, layer=0)
	{
		if (layer > 0)
		{
			//console.log(`Generating secondary generation for ${this.source}/${this.value}`);
		}

		if (this.source === undefined)
		{
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
			this.unsubscribeModifiers();

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
						this.children = lodash.mapValues(entry.children, (child) => {
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
			this.subscribeModifiers();
	}

	getValue()
	{
		if (typeof this.value === 'number')
		{
			let modifiedValue = this.value + this.getTotalModifier();
			if (typeof this.minimum === 'number') modifiedValue = Math.max(modifiedValue, this.minimum);
			return modifiedValue;
		}
		return this.value;
	}

	getTotalModifier()
	{
		const path = this.getPath();
		return this.modifiedBy.reduce((totalModifier, entryKey) =>
		{
			const entry = this.generator.getEntry(entryKey);
			if (entry)
			{
				const modifier = entry.getModifier(path, this.value);
				if (typeof modifier === 'number') return totalModifier + modifier;
				else
				{
					console.error('Found non-numerical modifier', modifier, `(${typeof modifier})`, 'for entry', this.getPath());
				}
			}
			return totalModifier;
		}, 0);
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

	getModifier(keyToModify, value)
	{
		return this.evalModifier(this.modifiers[keyToModify], value);
	}

	evalModifier(modToEval, value)
	{
		if (modToEval === undefined) return 0;
		else if (typeof modToEval === 'number') return modToEval;
		else if (Array.isArray(modToEval))
		{
			return modToEval.reduce((accum, mod) => accum + this.evalModifier(mod, value), 0);
		}
		else if (typeof modToEval === 'string')
		{
			// dont pass data to modifier evals, currently not required
			const modifier = inlineEval(modToEval, this.getLocalContext());
			return parseInt(modifier, 10);
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
								return currentIndex ? modToEval.values[keyframes[currentIndex]] : 0;
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
									return 0;
								}
								else
								{
									return intOp(lerped);
								}
							}
						default:
							break;
					}
					break;
				case 'multiply':
					const multiplier = inlineEval(modToEval.value, this.getLocalContext());
					return value * parseInt(parser(multiplier, {}), 10);
				default:
					break;
			}
		}
		console.warn('Encountered unimplemented modifier schema:', modToEval);
		return 0;
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
			lodash.values(this.categories[path]).forEach((entry) => this.regenerate(entry.getPath(), bGenerateDependencies));
			return;
		}

		if (!this.hasEntry(path))
		{
			throw new Error(`Missing entry '${path}', please add it via 'addEntry'.`);
		}

		const allData = this.getAllValues();

		const entry = this.getEntry(path);

		/*
		Object.keys(entry.modifiers).forEach((keyModifier) =>
		{
			const entryToModify = this.getEntry(keyModifier);
			if (entryToModify)
			{
				entryToModify.unsubscribeModifyingEntry(entry);
			}
		});
		//*/

		entry.generate(allData);

		/*
		Object.keys(entry.modifiers).forEach((keyModifier) =>
		{
			const entryToModify = this.getEntry(keyModifier);
			if (entryToModify)
			{
				entryToModify.subscribeModifyingEntry(entry);
			}
		});
		//*/

		if (bGenerateDependencies)
		{
			entry.getAllAffectedEntryPaths().forEach((affectedEntryPath) => this.regenerate(affectedEntryPath, true));
		}

	}

}