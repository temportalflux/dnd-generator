
/**
 * Generic wrapper class for asynchronous transations using IndexedDB.
 */
export default class IDB
{

	constructor(name, version, onUpgradeRequired)
	{
		this.name = name;
		this.version = version;
		this.onUpgradeRequired = onUpgradeRequired;
		this.db = null;
	}

	async do_open()
	{
		return new Promise((resolve, reject) => {

			if (!window.indexedDB)
			{
				reject("Your browser doesn't support a stable version of IndexedDB.");
				return;
			}

			let request = window.indexedDB.open(this.name, this.version);
			
			request.onerror = function() {
				reject('Database failed to open');
			};
		
			request.onsuccess = function() {
				resolve(request.result);
			};
		
			request.onupgradeneeded = (function(e) {
				let db = e.target.result;
				this.onUpgradeRequired(db, e.oldVersion, e.newVersion);
			}).bind(this);
			
		});
	}

	async open()
	{
		this.db = await this.do_open();
	}

}