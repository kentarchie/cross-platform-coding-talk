'use strict';
global.__base = __dirname + '/';
const Constants=require('./constants.js');
const Utilities=require('../mainJS/Utilities.js');
const {app, BrowserWindow,Menu} = require('electron');
const {ipcMain} = require('electron')
const path = require('path');
const Settings = require('electron-settings');

const url = require('url');
const yargs = require('yargs');
const APP_URL = 'file://' + __dirname + '/../clientApp/index.html';

let MainWindow = null;
let AboutWindow = null

let CliData = {};
let Utils = new Utilities();

function createMainWindow()
{
 // for more options  handling, see https://github.com/yargs/yargs
    var argv = require('yargs')
        .usage('Usage: $0 [-debug]')
        .argv;
    //Utils.logger('createWindow: isMain() -> %s', Config.isMain());
    if(!argv.debug) argv.debug=false;
    if(!argv.mdebug) argv.mdebug=false;
    if(!argv.rdebug) argv.rdebug=false;
    CliData.debug=argv.debug;
    CliData.rdebug=argv.rdebug;
    CliData.mdebug=argv.mdebug;

	 Utils = new Utilities(CliData);
    //Utils.logger('createWindow: Utils.logger isMain() -> %s', Utils.isMain());

    Utils.logger('createWindow: argv.debug ->%s', argv.debug);
    let windowWidth =  (Settings.has('UVM.windowWidth'))  ? Settings.get('UVM.windowWidth')  : Constants.DEFAULT_WINDOW_WIDTH;
    let windowHeight = (Settings.has('UVM.windowHeight')) ? Settings.get('UVM.windowHeight') : Constants.DEFAULT_WINDOW_HEIGHT;
    Utils.logger('createWindow config values: width :%d: height :%d:',windowWidth,windowHeight);

    if(CliData.debug)  {
      windowHeight += Constants.DEFAULT_DEBUG_HEIGHT_CHANGE;
      windowWidth  += Constants.DEFAULT_DEBUG_WIDTH_CHANGE;
    }

    MainWindow = new BrowserWindow({ 
		  'width': windowWidth
		  ,'height': windowHeight 
		  ,icon : path.join(__dirname , '../images/logo.png')
		  ,backgroundColor: "#D6D8DC" // background color of the page, prevents any white flickering
		  ,show: false // Don't show the window until it's ready, prevents any white flickering
    });

    // The BrowserWindow class extends the node.js core EventEmitter class, so we use that API
    // to listen to events on the BrowserWindow. The resize event is emitted when the window size changes.
    MainWindow.on('resize', () => {
      // The event doesn't pass us the window size, so we call the `getBounds` method which returns an object with
      // the height, width, and x and y coordinates.
      let { width, height } = MainWindow.getBounds();
      let windowSize = MainWindow.getBounds();
    	Utils.logger('createMainWindow: windowSize = :%s:',JSON.stringify(windowSize,null,'\t'));
      // Now that we have them, save them using the `set` method.
      Settings.set('UVM.windowWidth',width);
      Settings.set('UVM.windowHeight',height);
      Utils.logger('createWindow after resize: width :%d: height :%d:',width,height);
    }); // window resize

	 MainWindow.loadURL(APP_URL);
	 MainWindow.on('closed', () => { MainWindow = null; });
		  
    // Show window when page is ready
	 MainWindow.once('ready-to-show', () => { MainWindow.show(); });
		  
	 MainWindow.CliData = CliData;  // make CLI data available to  the renderer
	 if(CliData.debug || CliData.rdebug) MainWindow.webContents.openDevTools(); // Open the DevTools.
	
	 let menu = createMainMenu();
	 Utils.logger('createWindow: got menu template');
	 Menu.setApplicationMenu(menu); 
	 Utils.logger('createWindow: menu set');
} // createMainWindow

app.on('ready', () => {
  let userDataPath = app.getPath ('userData');
  Utils.logger('ready: userData = :%s:',userDataPath);
  if(!Settings.has('UVM.dbDir'))      Settings.set('UVM.dbDir',userDataPath+'/DB');
  else Utils.logger('ready: userDataPath already set is :%s:',userDataPath);
  Utils.logger('ready: dbDir in main is :%s:',Settings.get('UVM.dbDir'));

  if(!Settings.has('UVM.queriesDir')) Settings.set('UVM.queriesDir',userDataPath+'/Queries');
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
	Utils.logger('openAboutWindow: START');
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

	let urlToLoad = 'file://' + __dirname + '/../clientApp/about.html';
	Utils.logger('openAboutWindow: loading url ->%s', urlToLoad);
	AboutWindow.loadURL(urlToLoad);
	AboutWindow.setMenuBarVisibility(false)
  	//AboutWindow.webContents.openDevTools(); // Open the DevTools.

	AboutWindow.on('closed', () => { AboutWindow = null; });
} // openAboutWindow
