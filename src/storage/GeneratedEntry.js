import Filter from './Filter';
import { createExecutor } from '../generator/modules/createExecutor';

export default class GeneratedEntry
{

	static fromStorage(obj)
	{
		const data = new GeneratedEntry();
		data.readStorage(obj);
		return data;
	}

	static fromSchema(field)
	{
		const data = new GeneratedEntry();
		data.readSchema(field);
		return data;
	}

	constructor()
	{
		this.category = undefined;
		this.key = undefined;
	}

	readStorage(data)
	{
		this.category = data.category;
		this.key = data.key;
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

	getFilter()
	{
		return Filter.get(this.key);
	}

	regenerate(schema)
	{
		const macro = this.getGenerationMacro(schema);
		if (macro === undefined) return;
		const executed = macro();
		console.log(executed);
		// TODO: STUB
		
	}

}