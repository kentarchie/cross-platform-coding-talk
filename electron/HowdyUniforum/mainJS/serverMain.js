'use strict';
global.__base = __dirname + '/';
const {app, BrowserWindow} = require('electron');
const process = require('process');

const APP_URL = 'file://' + __dirname + '/../clientApp/index.html';

let MainWindow = null;

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

function createMainWindow()
{
    console.log('MAIN:createWindow:  __dirname ' + __dirname);
    MainWindow = new BrowserWindow({ 
		  'width': 800
		  ,'height': 600 
		  ,webPreferences: {
        		nodeIntegration: true
    		}
		  ,backgroundColor: "#D6D8DC" // background color of the page, prevents any white flickering
		  ,show: false // Don't show the window until it's ready, prevents any white flickering
    });

	 MainWindow.loadURL(APP_URL);
    console.log('MAIN: createWindow: page loaded');
    MainWindow.webContents.openDevTools(); // show chrome console

	 MainWindow.on('closed', () => { MainWindow = null; });
		  
    // Show window when page is ready
	 MainWindow.once('ready-to-show', () => { MainWindow.show(); });
} // createMainWindow

