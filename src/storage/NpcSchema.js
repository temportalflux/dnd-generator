import lodash from 'lodash';
import { Entry } from './Entry';

class Field extends Entry
{

	static fromStorage(obj)
	{
		const entry = new Field();
		entry.readStorage(obj);
		entry.category = obj.category;
		return entry;
	}

	static from(data)
	{
		const entry = new Field();
		entry.readFrom(data);
		entry.category = data.category;
		return entry;
	}

	constructor()
	{
		super();
		this.category = undefined;
	}

	getKeyPath()
	{
		return `${this.category}.${this.getKey()}`;
	}

	getCategory()
	{
		return this.category;
	}

}

export default class NpcSchema
{

	static fromStorage(obj)
	{
		const schema = new NpcSchema();
		if (!obj) return schema;
		schema.fields = lodash.mapValues(obj.fields, Field.fromStorage);
		schema.fieldOrder = obj.fieldOrder;
		schema.generationOrder = obj.generationOrder;
		schema.categories = obj.categories;
		return schema;
	}

	// takes a json object
	static from(obj)
	{
		const schema = new NpcSchema();

		schema.generationOrder = obj.generationOrder;
		
		for (let fieldData of obj.fieldOrder)
		{
			const field = schema.addField(fieldData);
			schema.fieldOrder.push(field.getKeyPath());
		}

		return schema;
	}

	constructor()
	{
		this.fields = {};
		this.fieldOrder = [];
		this.generationOrder = [];
		this.categories = {};
	}

	addField(data)
	{
		const field = Field.from(data);
		this.fields[field.getKeyPath()] = field;
		this.categories[field.getCategory()] = (this.categories[field.getCategory()] || []).concat([field.getKey()]);
		return field;
	}

	getFields()
	{
		return lodash.values(this.fields);
	}

	getField(keyPath)
	{
		return this.fields[keyPath];
	}

	getCategories()
	{
		return Object.keys(this.categories).sort();
	}

	getFieldsForCategory(category)
	{
		return (this.categories[category] || []).sort();
	}

	getFieldForCategory(category, key)
	{
		return this.categories[category][key];
	}

	getGenerationOrder()
	{
		return this.generationOrder;
	}

}
