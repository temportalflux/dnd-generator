import lodash from 'lodash';
import inlineEval from './modules/evalAtCtx';
import parser from './parser';

class GenerationEntry
{

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

	getKey()
	{
		return this.parent !== undefined ? `${this.parent.getKey()}.${this.key}` : `${this.category}.${this.key}`;
	}

	getName()
	{
		const path = lodash.toPath(this.getKey());
		return path[path.length - 1]
			.split(/(?=[A-Z])/)
			.map(
				(word) => `${word[0].toUpperCase()}${word.substr(1).toLowerCase()}`
			).join(' ');
	}

	setParent(parent)
	{
		this.parent = parent;
	}

	hasChildren()
	{
		return Object.keys(this.childEntries).length > 0;
	}

	setChild(childKey, entry)
	{
		this.childEntries[childKey] = entry;
	}

	addAffectiveEntry(key)
	{
		this.affects.push(key);
	}

	getAffectiveEntries()
	{
		return [
			...this.getChildrenKeysGlobal(),
			...this.affects,
		];
	}

	getChildren()
	{
		return this.children;
	}

	getChildrenKeysGlobal()
	{
		return Object.keys(this.getChildren()).map((key) => `${this.getKey()}.${key}`);
	}

	getEntry(subpath)
	{
		const { items, remaining } = Generator.sever(subpath);
		if (this.childEntries.hasOwnProperty(items[0]))
		{
			const child = this.childEntries[items[0]];
			return remaining.length > 0 ? child.getEntry(remaining) : child;
		}
		else return undefined;
	}

	getValue()
	{
		if (!this.hasChildren())
		{
			if (typeof this.value === 'number')
			{
				const totalModifier = this.generator.getModifications(this.modifyingEntryKeys, this.getKey());
				return this.value + totalModifier;
			}
			return this.value;
		}

		return lodash.mapValues(this.childEntries, (entry) => entry.getValue());
	}

	hasValue()
	{
		return this.value !== undefined;
	}

	compileData()
	{
		return lodash.values(this.childEntries).reduce((accum, entry) => ({
			...accum,
			...entry.compileData(),
		}), {
			[this.getKey()]: this.getValue(),
		});
	}

	getLocalData()
	{
		return lodash.values(this.childEntries).reduce((accum, entry) => ({
			...accum,
			...entry.getLocalData()
		}), {
			[this.key]: this.getValue()
		});
	}

	stringify()
	{
		if (typeof this.value === 'object')
		{
			if (Array.isArray(this.value))
			{
				return this.value.join(' ');
			}
			else if (this.metadata.stringify)
			{
				return inlineEval(this.metadata.stringify, this.getLocalData());
			}
			else
			{
				return '';
			}
		}
		return `${this.value}`;
	}

	canReroll()
	{
		return (
			this.metadata.canReroll === undefined || this.metadata.canReroll === true
		) && (this.parent === undefined || this.parent.canReroll());
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

		//console.log(this.source, lodash.cloneDeep(data));

		// Parser could return an undefined value if the command didn't work.
		// For example, a table like 'beard' is assumed to have an entry for every race,
		// so races can opt-in by defining a beard.json table. If one is missing, this is not an error,
		// but rather the race opting-out of generating beard data.
		const result = parser(this.source, data);
		//console.log(result);
		if (typeof result === 'object' && !Array.isArray(result))
		{
			this.value = result.value;
			this.modifiers = result.modifiers;
		}
		else
		{
			this.value = result;
			this.modifiers = {};
		}

	}

	subscribeModifyingEntry(entry)
	{
		this.modifyingEntryKeys.push(entry.getKey());
	}

	unsubscribeModifyingEntry(entry)
	{
		const entryKey = entry.getKey();
		this.modifyingEntryKeys = this.modifyingEntryKeys.filter((key) => key !== entryKey);
	}

	getModifier(keyToModify)
	{
		return this.evalModifier(this.modifiers[keyToModify]);
	}

	evalModifier(modToEval)
	{
		if (typeof modToEval === 'number') return modToEval;
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
		return 0;
	}

}

export default class Generator
{

	static convertCamelToTitleCase(text)
	{
		return text.split(/(?=[A-Z])/).map((word) => `${word[0].toUpperCase()}${word.substr(1).toLowerCase()}`).join(' ');
	}

	constructor()
	{
		this.categories = {};
	}

	hasCategory(category)
	{
		return this.categories.hasOwnProperty(category);
	}

	static sever(fullKey, itemCount=1)
	{
		const path = lodash.toPath(fullKey);
		return {
			items: path.slice(0, itemCount),
			remaining: path.slice(itemCount).join('.'),
		};
	}

	// TODO: hasEntry and getEntry should query the parent entries for their children - entries with parents are no longer stored in the category hierarchy

	hasEntry(fullKey)
	{
		return this.getEntry(fullKey) !== undefined;
	}

	getEntry(fullKey)
	{
		const {items, remaining} = Generator.sever(fullKey, 2);
		const entry = this.categories[items[0]][items[1]];
		return remaining.length > 0 ? entry.getEntry(remaining) : entry;
	}

	createField(category, key, field)
	{
		const entry = new GenerationEntry(this, category, key, field);

		if (entry.dependencies)
		{
			for (const dependencyKey of entry.dependencies)
			{
				if (!this.hasEntry(dependencyKey))
				{
					throw new Error(`Cannot create dependency from '${entry.getKey()}' on '${dependencyKey}', there is no entry for '${dependencyKey}'.`);
				}
				this.getEntry(dependencyKey).addAffectiveEntry(entry.getKey());
			}
		}

		const children = entry.getChildren();
		const childrenKeys = Object.keys(children);
		if (childrenKeys.length > 0)
		{
			for (const childKey of childrenKeys)
			{
				const childEntry = this.createField(category, childKey, children[childKey]);
				childEntry.setParent(entry);
				entry.setChild(childKey, childEntry);
			}
		}

		return entry;
	}

	// key - the key path i.e. 'a.b[3].c'
	// template - the text in the json used to cause a generation i.e. "{roll:race/$(description.race)/hair}"
	// dependencies - any other entries that would cause this entry to be regenerated by (i.e. ["description.race"])
	// The fields this depends on must already exist in the generator
	addField(category, key, field)
	{
		const entry = this.createField(category, key, field);
		
		if (!this.hasCategory(entry.category))
		{
			this.categories[entry.category] = {};
		}
		this.categories[entry.category][entry.key] = entry;

		return entry;
	}

	compileData()
	{
		return lodash.values(this.categories).reduce(
			(accum, categoryEntries) => ({
				...accum,
				...lodash.toPairs(categoryEntries)
					.filter(([_, entry]) => entry.hasChildren() || entry.hasValue())
					.reduce((accumCate, [_, entry]) => ({
						...accumCate,
						...entry.compileData()
					}), {})
			}), {}
		);
	}

	// causes a generation of the entry at key
	regenerate(key, bGenerateDependencies = true)
	{
		if (!this.hasEntry(key))
		{
			throw new Error(`Missing entry '${key}', please add it via 'addField'.`);
		}

		const entry = this.getEntry(key);
		
		Object.keys(entry.modifiers).forEach((keyModifier) => {
			const entryToModify = this.getEntry(keyModifier);
			if (entryToModify)
			{
				entryToModify.unsubscribeModifyingEntry(entry);
			}
		});
		
		entry.generate(this.compileData());

		Object.keys(entry.modifiers).forEach((keyModifier) => {
			const entryToModify = this.getEntry(keyModifier);
			if (entryToModify)
			{
				entryToModify.subscribeModifyingEntry(entry);
			}
		});

		if (bGenerateDependencies)
		{
			let affectiveEntryKeys = entry.getAffectiveEntries();
			for (const affectedEntryKey of affectiveEntryKeys)
			{
				this.regenerate(affectedEntryKey, true);
			}
		}

	}

	getModifications(modifierEntryKeys, keyToModify)
	{
		return modifierEntryKeys.reduce((totalModifier, entryKey) => {
			const entry = this.getEntry(entryKey);
			if (entry)
			{
				const modifier = entry.getModifier(keyToModify);
				if (typeof modifier === 'number') return totalModifier + modifier;
			}
			return totalModifier;
		}, 0);
	}

}