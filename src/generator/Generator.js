import lodash from 'lodash';
import inlineEval from './modules/evalAtCtx';
import parser from './parser';

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
			source: undefined,

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

	/*
	constructor(generator, category, key, { source, dependencies, stringify, canReroll, children })
	{
		this.generator = generator;
		this.category = category;
		this.key = key;
		this.source = source;
		this.parent = undefined;

		// list of entries that regenerating this entry will cause to regenerate
		this.affects = [];

		this.dependencies = dependencies;

		this.children = children || {};
		this.childEntries = {};

		// Whatever the current value of this object is
		this.value = children ? {} : undefined;

		// An object with keys to other fields and whose values are the addition/subtractions used to modify that value
		this.modifiers = {};

		this.metadata = {
			stringify: stringify,
			canReroll: canReroll,
		};

		// keys of other attributes which have modifiers for this entry
		this.modifyingEntryKeys = [];
	}
	//*/

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

	toString()
	{
		if (this.stringify)
		{
			const lineageValues = lodash.get(this.getLineageValues(), this.getPath());
			const value = this.getValue();
			const isValueAnObject = typeof value === 'object' && !Array.isArray(value);
			const context = lodash.assign({},
				lineageValues,
				isValueAnObject ? value : { value: value }
			);
			return inlineEval(this.stringify, context);
		}
		else if (Array.isArray(this.value))
		{
			return this.value.join(' ');
		}
		return `${this.value}`;
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

		if (!this.hasChildren())
		{
			lodash.set(values, this.getPath(),
				this.getValue()
			);
		}
		else
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

	generate(data)
	{
		if (this.source === undefined) return;

		if (this.dependencies)
		{
			for (const dependencyKey of this.dependencies)
			{
				if (!data.hasOwnProperty(dependencyKey)) return;
			}
		}

		if (this.childrenAreGenerated)
		{
			this.clearChildren();
		}

		this.unsubscribeModifiers();

		// Parser could return an undefined value if the command didn't work.
		// For example, a table like 'beard' is assumed to have an entry for every race,
		// so races can opt-in by defining a beard.json table. If one is missing, this is not an error,
		// but rather the race opting-out of generating beard data.
		const result = parser(this.source, data);
		console.log(this.getPath(), lodash.cloneDeep(result));
		if (typeof result === 'object' && !Array.isArray(result))
		{
			const entry = this.createEntry(result);
			if (!entry.isValid())
			{
				const entryModifiers = lodash.cloneDeep(entry.modifiers);
				entry.modifiers = {};

				entry.generate(data);
				this.value = entry.getValue();
				
				// For now, ignore modifiers generated by secondary generations
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

		this.subscribeModifiers();
	}

	getValue()
	{
		if (typeof this.value === 'number')
		{
			return this.value + this.getTotalModifier();
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
				const modifier = entry.getModifier(path);
				if (typeof modifier === 'number') return totalModifier + modifier;
			}
			return totalModifier;
		}, 0)
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

	getModifier(keyToModify)
	{
		return this.evalModifier(this.modifiers[keyToModify]);
	}

	evalModifier(modToEval)
	{
		if (modToEval === undefined) return 0;
		else if (typeof modToEval === 'number') return modToEval;
		else if (Array.isArray(modToEval))
		{
			return modToEval.reduce((accum, mod) => accum + this.evalModifier(mod), 0);
		}
		else if (typeof modToEval === 'object')
		{
			switch (modToEval.type)
			{
				case 'curve':
					switch (modToEval.curve)
					{
						case 'step':
							const keyframes = Object.keys(modToEval.values);
							let currentIndex = undefined;
							let nextIndex = keyframes.length > 0 ? 0 : undefined;
							while (nextIndex !== undefined && this.value > keyframes[nextIndex])
							{
								currentIndex = nextIndex;
								nextIndex++;
								if (nextIndex >= keyframes.length) nextIndex = undefined;
							}
							return currentIndex ? modToEval.values[keyframes[currentIndex]] : 0;
						default:
							break;
					}
					break;
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