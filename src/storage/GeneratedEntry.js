import Filter from './Filter';
import lodash from 'lodash';
import { createExecutor } from '../generator/modules/createExecutor';
import { inlineEval } from '../generator/modules/evalAtCtx';

export default class GeneratedEntry
{

	static fromSchema(field)
	{
		const data = new GeneratedEntry();
		data.readSchema(field);
		return data;
	}

	constructor()
	{
		this.events = new EventTarget();

		this.category = undefined;
		this.key = undefined;

		this.generated = undefined;
	}

	readSchema(field)
	{
		this.category = field.getCategory();
		this.key = field.getKey();
	}

	getKeyPath()
	{
		if (this.key === undefined) return undefined;
		else if (this.category === undefined) return this.key;
		else return `${this.category}.${this.key}`;
	}

	getField(schema)
	{
		return schema.getField(this.getKeyPath());
	}

	getGenerationMacro(schema)
	{
		const field = this.getField(schema);
		if (!field.hasSource()) return undefined;
		const macro = createExecutor(field.getSource());
		if (macro === undefined)
		{
			console.warn('Failed to find a valid exec source functor for field:', field);
		}
		return macro;
	}

	getFilterValue()
	{
		return Filter.get(this.getKeyPath());
	}

	regenerate(schema, globalData)
	{
		const macro = this.getGenerationMacro(schema);
		if (macro === undefined) return;
		const context = {
			...globalData,
			filter: this.getFilterValue(),
		};
		this.generated = macro(context);
		this.events.dispatchEvent(new CustomEvent('onChanged', {
			detail: {}
		}));
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
		return generated.value || (generated.entry ? generated.entry.getKey() : undefined);
	}

	getModifiedValue()
	{
		// TODO
		return this.getRawValue();
	}

	toString(globalData)
	{
		const entry = this.generated ? this.generated.entry : undefined;
		const stringify = entry ? entry.stringify : undefined;
		return stringify ? inlineEval(stringify, globalData || {}) : `${this.getModifiedValue()}`;
	}

}