import storage from 'local-storage';

export default class Filter
{

	static all()
	{
		return (storage.get('filters') || {});
	}

	static get(key)
	{
		return Filter.all()[key];
	}

	static set(key, filter)
	{
		const allFilters = Filter.all();
		allFilters[key] = filter;
		storage.set('filters', allFilters);
	}

	static remove(key)
	{
		const allFilters = Filter.all();
		delete allFilters[key];
		storage.set('filters', allFilters);
	}

	static clear()
	{
		storage.set('filters', {});
	}

}