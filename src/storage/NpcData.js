import lodash from 'lodash';
import TableCollection from './TableCollection';
import GeneratedEntry from './GeneratedEntry';
import * as queryString from 'query-string';

let NPC_TEMPORARY_DATA = null;

export default class NpcData
{

	static EVENTS = new EventTarget();
	static EVENT_INITIALIZED = 'onInitialized';

	static sever(fullKey, itemCount = 1)
	{
		const path = lodash.toPath(fullKey);
		return {
			items: path.slice(0, itemCount),
			remaining: path.slice(itemCount).join('.'),
		};
	}

	static toggleOnInitialized(status, callback)
	{
		switch (status)
		{
			case 'on':
				NpcData.EVENTS.addEventListener(NpcData.EVENT_INITIALIZED, callback);
				break;
			case 'off':
				NpcData.EVENTS.removeEventListener(NpcData.EVENT_INITIALIZED, callback);
				break;
			default: break;
		}
	}

	static getSchema()
	{
		const tableCollection = TableCollection.get();
		return tableCollection ? tableCollection.getNpcSchema() : undefined;
	}

	static initialize(onInitialized)
	{
		const schema = NpcData.getSchema();
		if (!schema) { return; }
		
		console.log('Initializing NPC data');
		const data = new NpcData();

		const fields = schema.getFields();
		for (let field of fields)
		{
			data.addEntry(field);
		}

		NPC_TEMPORARY_DATA = data;

		if (typeof onInitialized === 'function')
		{
			onInitialized(data);
		}

		NpcData.EVENTS.dispatchEvent(new CustomEvent(this.EVENT_INITIALIZED, {
			detail: { npc: NPC_TEMPORARY_DATA }
		}));
	}

	setState(state)
	{
		this.saveState = state;
		this.save();
	}

	static get()
	{
		return NPC_TEMPORARY_DATA;
	}

	static clear()
	{
		window.sessionStorage.removeItem('npc');
		NpcData.initialize((npc) => npc.regenerateAll(NpcData.getState() || {}));
	}

	static getState()
	{
		return JSON.parse(window.sessionStorage.getItem('npc'));
	}

	static getCurrentLinkData()
	{
		const npcDataInUrl = queryString.parse(window.location.search);
		if (typeof npcDataInUrl.npc === 'string') 
		{
			return JSON.parse(npcDataInUrl.npc);
		}
		return undefined;
	}

	static getLink()
	{
		const stateString = JSON.stringify(NpcData.getState());
		const encoded = encodeURIComponent(stateString);
		return `${window.location.href.slice(0, -1)}?npc=${encoded}`;
	}

	constructor()
	{
		this.events = new EventTarget();

		this.entries = {};
		this.categories = {};

		this.saveState = {};
	}

	toggleListener(event, status, callback)
	{
		switch (status)
		{
			case 'on':
				this.events.addEventListener(event, callback);
				break;
			case 'off':
				this.events.removeEventListener(event, callback);
				break;
			default: break;
		}
	}

	addEntry(field)
	{
		const entry = new GeneratedEntry(this);
		entry.readEntry(field);
		entry.category = field.getCategory();
		this.entries[entry.getKeyPath()] = entry;
		this.categories[field.category] = (this.categories[field.getCategory()] || []).concat([field.getKey()]);
	}

	getEntry(keyPath)
	{
		const { items, remaining } = NpcData.sever(keyPath, 2);
		const entry = this.entries[`${items[0]}.${items[1]}`];
		return remaining.length > 0 && entry !== undefined ? entry.getChild(remaining) : entry;
	}

	getCategories()
	{
		return Object.keys(this.categories).sort();
	}

	getEntriesForCategory(category)
	{
		return (this.categories[category] || []).sort();
	}

	regenerateAll(presetData)
	{
		const schema = NpcData.getSchema();
		const globalData = {};
		for (let entryKey of schema.getGenerationOrder())
		{
			const entry = this.entries[entryKey];
			const getPreset = (e) => presetData !== undefined ? lodash.cloneDeep(presetData[e.getKeyPath()]) : undefined;
			entry.regenerate(globalData, getPreset);
			entry.getModifiedData(globalData);
		}
		this.save();
	}

	forAllEntries(loop)
	{
		lodash.values(this.entries).forEach(loop);
	}

	getModifiedData()
	{
		const values = {}
		this.forAllEntries((entry) => entry.getModifiedData(values));
		return values;
	}

	updateSaveState(key, state)
	{
		if (state === undefined) { delete this.saveState[key]; }
		else this.saveState[key] = state;
	}

	save()
	{
		window.sessionStorage.setItem('npc', JSON.stringify(this.saveState));
	}

}