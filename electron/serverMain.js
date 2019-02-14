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


let appShell = null;

function createMainWindow() {
 // for more options  handling, see https://github.com/yargs/yargs
    let cliData = {};
    var argv = require('yargs')
        .usage('Usage: $0 [-debug]')
        .argv;
    if(!argv.debug) argv.debug=false;
    cliData.debug=argv.debug;
    console.log('createWindow: argv.debug ->', argv.debug);
    let WindowHeight = (cliData.debug) ? DEFAULT_DEBUG_HEIGHT : DEFAULT_WINDOW_HEIGHT;
    let WindowWidth  = (cliData.debug) ? DEFAULT_DEBUG_WIDTH : DEFAULT_WINDOW_WIDTH;

    appShell = new BrowserWindow({ 
        width: WindowWidth
        ,height: WindowHeight 
    });
    appShell.loadURL(APP_URL);
    appShell.on('closed', () => { appShell = null; });
    if(cliData.debug) appShell.webContents.openDevTools();
}

app.on('ready', createMainWindow);

//quit the app once closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit();
});

app.on('activate', () => {
    if (appShell == null)
        createMainWindow();
});