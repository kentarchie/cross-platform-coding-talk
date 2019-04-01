'use strict';
const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const yargs = require('yargs');

const DEFAULT_WINDOW_HEIGHT = 600;
const DEFAULT_WINDOW_WIDTH = 800;
const DEFAULT_DEBUG_HEIGHT = 700;
const DEFAULT_DEBUG_WIDTH = 1000;
const APP_URL = 'file://' + __dirname + '/clientApp/index.html';

let MainWindow = null;
let CliData = {};

function createMainWindow() {
 // for more options  handling, see https://github.com/yargs/yargs
    var argv = require('yargs')
        .usage('Usage: $0 [-debug]')
        .argv;
    if(!argv.debug) argv.debug=false;
    CliData.debug=argv.debug;
    logger('createWindow: argv.debug ->%s', argv.debug);
    let WindowHeight = (CliData.debug) ? DEFAULT_DEBUG_HEIGHT : DEFAULT_WINDOW_HEIGHT;
    let WindowWidth  = (CliData.debug) ? DEFAULT_DEBUG_WIDTH : DEFAULT_WINDOW_WIDTH;

    MainWindow = new BrowserWindow({ 
        width: WindowWidth
        ,height: WindowHeight 
    });
	MainWindow.loadURL(APP_URL);
	MainWindow.on('closed', () => { MainWindow = null; });
	MainWindow.CliData = CliData;  // make CLI data available to  the renderer
  if(CliData.debug) MainWindow.webContents.openDevTools(); // Open the DevTools.
	
}

app.on('ready', createMainWindow);

//quit the app once closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit();
});

app.on('activate', () => {
    if (MainWindow == null)
        createMainWindow();
});

function logger(format,...args)
{
  console.log('serverMain.logger start');
  if(CliData.debug) {
    console.log('MAIN: ' + format, ...args);
  }
} // logger
