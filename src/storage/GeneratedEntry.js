import Filter from './Filter';
import lodash from 'lodash';
import { createExecutor } from '../generator/modules/createExecutor';
import { inlineEval } from '../generator/modules/evalAtCtx';

export default class GeneratedEntry
{

	static fromSchema(field)
	{
		const data = new GeneratedEntry();
		data.readEntry(field);
		data.category = field.getCategory();
		return data;
	}

	static fromEntry(entry)
	{
		const data = new GeneratedEntry();
		data.readEntry(entry);
		return data;
	}

	constructor()
	{
		this.events = new EventTarget();

		this.schemaEntry = undefined;

		this.category = undefined;
		this.key = undefined;

		this.generated = undefined;
		this.generatedChildren = undefined;
	}

	readEntry(entry)
	{
		this.schemaEntry = entry;
		this.key = entry.getKey();
	}

	getKeyPath()
	{
		if (this.key === undefined) return undefined;
		else if (this.category === undefined) return this.key;
		else return `${this.category}.${this.key}`;
	}

	getField()
	{
		return this.schemaEntry;
	}

	getGenerationMacro()
	{
		if (!this.getField().hasSource()) return undefined;
		const macro = createExecutor(this.getField().getSource());
		if (macro === undefined)
		{
			console.warn('Failed to find a valid exec source functor for field:', this.getField());
		}
		return macro;
	}

	getFilterValue()
	{
		return Filter.get(this.getKeyPath());
	}

	regenerate(globalData)
	{
		const macro = this.getGenerationMacro();
		if (macro === undefined) return;
		const context = {
			...globalData,
			filter: this.getFilterValue(),
		};
		this.generated = macro(context);
		this.generatedChildren = this.generated && this.generated.entry && this.generated.entry.hasChildren()
			? lodash.mapValues(this.generated.entry.getChildren(), (child) => {
				const clone = GeneratedEntry.fromEntry(child);
				clone.parent = child;
				return clone;
			}) : undefined;
		this.events.dispatchEvent(new CustomEvent('onChanged', {
			detail: {}
		}));
	}

	getGeneratedEntry()
	{
		return this.generated ? this.generated.entry : undefined;
	}

	getModifiedData(values)
	{
		// TODO
		const hasChildren = false;//this.hasChildren();

		const localValue = this.getModifiedValue();
		if (localValue !== undefined)
		{
			lodash.set(values, `${this.getKeyPath()}.value`, localValue);
			if (!hasChildren)
			{
				lodash.set(values, this.getKeyPath(), localValue);
			}
		}

		lodash.set(values, `${this.getKeyPath()}String`, this.toString());
		
		/*
		if (hasChildren)
		{
			lodash.values(this.getChildren()).forEach(
				(child) => child.getLineageValues(values)
			);
		}
		//*/
	}

	addListenerOnChanged(callback)
	{
		this.events.addEventListener('onChanged', callback);
	}

	removeListenerOnChanged(callback)
	{
		this.events.removeEventListener('onChanged', callback);
	}

	getRawValue()
	{
		const generated = this.generated || {};
		const genEntry = this.getGeneratedEntry();
		return generated.value || (genEntry ? genEntry.getKey() : undefined);
	}

	getModifiedValue()
	{
		// TODO
		return this.getRawValue();
	}

	toString(globalData)
	{
		const genEntry = this.getGeneratedEntry();
		const stringify = genEntry ? genEntry.stringify : undefined;
		return stringify ? inlineEval(stringify, globalData || {}) : `${this.getModifiedValue()}`;
	}

	getModifiers()
	{
		return (this.generated ? this.generated.modifiers : undefined) || {};
	}

	hasChildren()
	{
		return this.generatedChildren && Object.keys(this.generatedChildren).length > 0;
	}

	getChildren()
	{
		return this.hasChildren() ? this.generatedChildren : {};
	}

}