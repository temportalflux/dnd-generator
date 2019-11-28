
const EVENTS = new EventTarget();

export class View
{

	static set(view)
	{
		if (view === View.get()) { return; }
		window.sessionStorage.setItem("view", view);
		EVENTS.dispatchEvent(new CustomEvent('onChanged_view', { detail: view }));
	}

	static get()
	{
		return window.sessionStorage.getItem("view");
	}

	static subscribeOnChanged(callback)
	{
		EVENTS.addEventListener('onChanged_view', callback);
	}

	static unsubscribeOnChanged(callback)
	{
		EVENTS.removeEventListener('onChanged_view', callback);
	}

}

export class Table
{

	static set(value)
	{
		if (value === Table.get()) { return; }
		window.sessionStorage.setItem("table", value);
		EVENTS.dispatchEvent(new CustomEvent('onChanged_table', { detail: value }));
	}

	static get()
	{
		return window.sessionStorage.getItem("table");
	}

	static subscribeOnChanged(callback)
	{
		EVENTS.addEventListener('onChanged_table', callback);
	}

	static unsubscribeOnChanged(callback)
	{
		EVENTS.removeEventListener('onChanged_table', callback);
	}

}