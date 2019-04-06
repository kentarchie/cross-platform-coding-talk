// almost all the code comes from
// https://medium.com/cameron-nokes/how-to-store-user-data-in-electron-3ba6bf66bc1e
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
    ,'windowBounds': { 'windowWidth': DEFAULT_WINDOW_WIDTH, 'windowHeight': DEFAULT_WINDOW_HEIGHT }
};

//let logger = console.log;
class Config {
  constructor(opts) {
    const finalOpts = Object.assign({}, DEFAULTS, opts);
    this.opts = finalOpts;
    if(opts.logger) logger = opts.logger;
    console.log('console.log: Config.logger = :%s:',opts.logger);
    // Renderer process has to get `app` module via `remote`, whereas the main process can get it directly
    // app.getPath('userData') will return a string of the user's app data directory path.
    const userDataPath = (electron.app || electron.remote.app).getPath('userData');
    logger('Config.userDataPath = :%s:',userDataPath);
    console.log('console.log: Config.userDataPath = :%s:',userDataPath);
    // We'll use the `configName` property to set the file name and path.join to bring it all together as a string
    this.path = path.join(userDataPath, opts.configName + '.json');
    
    this.data = parseDataFile(this.path);
    console.log('console.log: Config.data = :%s:',JSON.stringify(this.data,null,'\t'));
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
       fs.writeFileSync(this.path, JSON.stringify(this.data));
  } // set
}

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