'use strict';
global.__base = __dirname + '/';
const { app, BrowserWindow,Menu } = require('electron');
const { ipcMain } = require('electron')
const path = require('path');
const settings = require('electron-settings');
const ManageConfig = require('./config.js');

const url = require('url');
const yargs = require('yargs');
// config ahndling code mostly from
// https://medium.com/cameron-nokes/how-to-store-user-data-in-electron-3ba6bf66bc1e
const DEFAULT_WINDOW_HEIGHT = 600;
const DEFAULT_WINDOW_WIDTH = 800;
const DEFAULT_DEBUG_HEIGHT_CHANGE = 100;
const DEFAULT_DEBUG_WIDTH_CHANGE = 600;
const APP_URL = 'file://' + __dirname + '/clientApp/index.html';

let MainWindow = null;
let AboutWindow = null

let CliData = {};

// First instantiate the class
const Config = new ManageConfig({
  // We'll call our data file 'user-preferences'
  logger : logger
  ,configName: 'user-preferences'
});

function createMainWindow() {
 // for more options  handling, see https://github.com/yargs/yargs
    var argv = require('yargs')
        .usage('Usage: $0 [-debug]')
        .argv;
    if(!argv.debug) argv.debug=false;
    CliData.debug=argv.debug;
    logger('createWindow: argv.debug ->%s', argv.debug);
    let { windowWidth, windowHeight } = Config.get('windowBounds');
    logger('createWindow config values: width :%d: height :%d:',windowWidth,windowHeight);

    if(CliData.debug)  {
      windowHeight += DEFAULT_DEBUG_HEIGHT_CHANGE;
      windowWidth  += DEFAULT_DEBUG_WIDTH_CHANGE;
    }
    //let WindowHeight = (CliData.debug) ? DEFAULT_DEBUG_HEIGHT : DEFAULT_WINDOW_HEIGHT;
    //let WindowWidth  = (CliData.debug) ? DEFAULT_DEBUG_WIDTH : DEFAULT_WINDOW_WIDTH;

    MainWindow = new BrowserWindow({ 
		  'width': windowWidth
		  ,'height': windowHeight 
		  ,icon : path.join(__dirname , 'images/logo.png')
		  ,backgroundColor: "#D6D8DC" // background color of the page, prevents any white flickering
		  ,show: false // Don't show the window until it's ready, prevents any white flickering
    });

    // The BrowserWindow class extends the node.js core EventEmitter class, so we use that API
    // to listen to events on the BrowserWindow. The resize event is emitted when the window size changes.
    MainWindow.on('resize', () => {
      // The event doesn't pass us the window size, so we call the `getBounds` method which returns an object with
      // the height, width, and x and y coordinates.
      let { windowWidth, windowHeight } = MainWindow.getBounds();
      // Now that we have them, save them using the `set` method.
      Config.set('windowBounds', { windowWidth, windowHeight });
      logger('createWindow after resize: width :%d: height :%d:',windowWidth,windowHeight);
    }); // window resize

	  MainWindow.loadURL(APP_URL);
	  MainWindow.on('closed', () => { MainWindow = null; });
		  
    // Show window when page is ready
	  MainWindow.once('ready-to-show', () => { MainWindow.show(); });
		  
	  MainWindow.CliData = CliData;  // make CLI data available to  the renderer
	  if(CliData.debug) MainWindow.webContents.openDevTools(); // Open the DevTools.
	
	  let menu = createMainMenu();
	  logger('createWindow: got menu template');
	  Menu.setApplicationMenu(menu); 
	  logger('createWindow: menu set');
} // createMainWindow

app.on('ready', () => {
  createMainWindow();
});

//quit the app once closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit();
});

app.on('activate', () => {
    if (MainWindow == null)
        createMainWindow();
});

function createMainMenu()
{
  let menu = Menu.buildFromTemplate([
    {
      label: 'Menu'
      ,submenu: [
        {
          label:'Create Voter DB'
          ,click() { 
				// read voter list CSV and create DB
            MainWindow.webContents.send('create-voter-db', 'click!'); 
          }
        }
        ,{
          label:'Re-Create Voter DB'
          ,click() { 
				// delete current voter DB and create new one
            MainWindow.webContents.send('recreate-voter-db', 'click!'); 
          }
        }
        ,{
          label:'Delete Voter DB'
          ,click() { 
				// delete current voter DB
            MainWindow.webContents.send('delete-voter-db', 'click!'); 
          }
        }
        ,{
          label:'Settings'
          ,click() { 
          }
        }
        ,{
          label:'Toggle Debug'
          ,accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I'
          ,click (item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools();
          }
        }
        ,{type:'separator'} 
        ,{
          label:'Exit'
          ,role : 'quit'
          ,accelerator: 'CmdOrCtrl+Shift+Q'
          ,click() { 
            app.quit() 
          }
        } // exit menu item
      ]
    } // Menu top menu item
    ,{
        label: 'About'
        ,submenu: [
          {
            label:'About'
            ,click() { 
              openAboutWindow();
            }
          }
        ]
    } // About top menu item
  ]);
  return menu;
} // createMainMenu

function openAboutWindow()
{
	logger('openAboutWindow: START');
	if(AboutWindow) {
		AboutWindow.focus();
		return;
	}
	AboutWindow = new BrowserWindow({
		title : 'About Voter List Manager'
		,width : 500
		,height: 400
		,resizable : false
		,minimizable : false
		,fullscreenable : false
		,backgroundColor: "#d7ef77" 
	});

	let urlToLoad = 'file://' + __dirname + '/clientApp/about.html';
	logger('openAboutWindow: loading url ->%s', urlToLoad);
	AboutWindow.loadURL(urlToLoad);
	AboutWindow.setMenuBarVisibility(false)
  	//AboutWindow.webContents.openDevTools(); // Open the DevTools.

	AboutWindow.on('closed', () => { AboutWindow = null; });
} // openAboutWindow

function logger(format,...args)
{
	//console.log('serverMain.logger start');
	if(CliData.debug) {
		console.log('MAIN: ' + format, ...args);
	}
} // logger