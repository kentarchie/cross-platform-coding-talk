// some ideas from
//https://medium.com/cameron-nokes/how-to-store-user-data-in-electron-3ba6bf66bc1e

const electron = require('electron');
const path = require('path');
const fs = require('fs');
const Datastore = require('nedb');j

class DataBaseManagement 
{
    constructor(opts)
    {
			console.log('DataBaseManagement.constructor START ');
    	this.DBFileName = '';
			// Renderer process has to get `app` module via `remote`, whereas the main process can get it directly
			// app.getPath('userData') will return a string of the user's app data directory path.
			const userDataPath = (electron.app || electron.remote.app).getPath('userData');
			// We'll use the `configName` property to set the file name and path.join to bring it all together as a string
			this.path = path.join(userDataPath, opts.configName + '.json');
		} // constructor

	init(dbFileName)
	{
		this.DBFileName = dbFileName;
		console.log('DataBaseManagement.init dbFileName (%s)',dbFileName);
	} // init
} // DataBaseManagement
