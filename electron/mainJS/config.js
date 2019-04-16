// almost all the code comes from
// https://medium.com/cameron-nokes/how-to-store-user-data-in-electron-3ba6bf66bc1e
const Constants=require('./constants.js');
const electron = require('electron');
const path = require('path');
const fs = require('fs');

const DEFAULTS = {
  'csvFileName' : ''
    ,'csvFileDate' : ''
    ,'votersDBName' : ''
    ,'queryDBName' : ''
    ,'numberDBRecords' : 0
    ,'numberDBFields' : 0
    ,'windowBounds': { 'windowWidth': Constants.DEFAULT_WINDOW_WIDTH, 'windowHeight': Constants.DEFAULT_WINDOW_HEIGHT }
};

let logger = console.log;
class Config {
  constructor(opts) {
    const finalOpts = Object.assign({}, DEFAULTS, opts);
    //this.opts = finalOpts;
    if(finalOpts.logger) logger = finalOpts.logger;
    console.log('console.log: Config.logger = :%s:',finalOpts.logger);
    // Renderer process has to get `app` module via `remote`, whereas the main process can get it directly
    // app.getPath('userData') will return a string of the user's app data directory path.
    const userDataPath = (electron.app || electron.remote.app).getPath('userData');
    //logger('Config.userDataPath = :%s:',userDataPath);
	 finalOpts['userDataPath'] = userDataPath;
    console.log('console.log: Config.userDataPath = :%s:',finalOpts.userDataPath);
    // We'll use the `configName` property to set the file name and path.join to bring it all together as a string
    this.path = path.join(finalOpts.userDataPath, finalOpts.configName + '.json');
    console.log('console.log: constructor:Config.path = :%s:',this.path);

	 if(fs.existsSync( this.path)) {
     	console.log('File exists');
		this.data = parseDataFile(this.path);
	 	if(this.data.csvFileName) $('#csvFileName').html(this.data['csvFileName']);
	 	if(this.data.csvFileDate) $('#csvFileDate').html(this.data['csvFileDate']);
	 	if(this.data.numberOfRecords) $('#numberOfRecords').html(this.data['numberOfRecords']);
	 	if(this.data.numberOfFields) $('#numberOfFields').html(this.data['numberOfFields']);
    } 
	 else {
			this.data=finalOpts;
			fs.writeFileSync(this.path, JSON.stringify(this.data));
    } 
    console.log('console.log: Config.data = :%s:',JSON.stringify(this.data,null,'\t'));
    console.log('console.log: finalOpts = :%s:',JSON.stringify(finalOpts,null,'\t'));
    console.log('console.log: DEFAULTS = :%s:',JSON.stringify(DEFAULTS,null,'\t'));
  } // constructor
  
  // This will just return the property on the `data` object
  get(key)
  {
    return this.data[key];
  } // get
  
  // ...and this will set it
  set(key, val) 
  {
    this.data[key] = val;
    // Wait, I thought using the node.js' synchronous APIs was bad form?
    // We're not writing a server so there's not nearly the same IO demand on the process
    // Also if we used an async API and our app was quit before the asynchronous write had a chance to complete, // we might lose that data. Note that in a real app, we would try/catch this.
    console.log('console.log: set():Config.path = :%s:',this.path);
    fs.writeFileSync(this.path, JSON.stringify(this.data,null,'\t'));
  } // set

  // lifted from is-electron npm package
  isMain() 
  {
		let one = typeof window !== 'undefined';
		let two = one && typeof window.process === 'object';
		let three = one && window.process.type === 'renderer';
		//console.log('isMain: one is :' + one + ':');
		//console.log('isMain: two is :' + two + ':');
		//console.log('isMain: three is :' + three + ':');
		if(one && two && three) {
			console.log('isMain: renderer');
			return true
		}

		let four = typeof process !== 'undefined';
		let five = typeof process.versions === 'object';
		let six = !! process.versions.electron;
		//console.log('isMain: four is :' + four + ':');
		//console.log('isMain: five is :' + five + ':');
		//console.log('isMain: six is :' + six + ':');
		if(four && five && six) {
			console.log('isMain: main');
			return true;
		}

		console.log('isMain: Both');
		return true;

  } // isMain
} // class

function parseDataFile(filePath) 
{
  // We'll try/catch it in case the file doesn't exist yet, which will be the case on the first application run.
  // `fs.readFileSync` will return a JSON string which we then parse into a Javascript object
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch(error) {
    // if there was some kind of error, return the passed in defaults instead.
    return DEFAULTS;
  }
} // parseDataFile

// expose the class
module.exports = Config;
