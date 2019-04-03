const {remote} = require('electron');
const { ipcRenderer } = require('electron')
const fsLib = require('fs');
const pathLib = require('path');
const {dialog} = require('electron').remote;
const csv=require('csvtojson')

let CliData = remote.getCurrentWindow().CliData; // parameters from the command line

$(document).ready(function()
{
	logger('ready: START ');

   ipcRenderer.on('create-voter-db', (event, arg) => {
        logger('ready: great-voter-db received');
        getCSVFile();
        logger('ready: voter db setup');
    });
		  
   var copyRightYear = new Date().getFullYear();
   logger('init:  copyRightYear=:%s:',copyRightYear);
   $('.copyright span').html(copyRightYear);

	logger('ready: FINISHED ');
}); // ready function

function getCSVFile () 
{
	dialog.showOpenDialog((fileNames) => {
    // fileNames is an array that contains all the selected
    if(fileNames === undefined){
        console.log("No file selected");
        return;
    }
	 if(fileNames.length == 0) {
		logger('No file selected');
		return;
	 }
	 logger('ready: file selected =:%s:',fileNames[0]);
	 let jsonObj = [];
	 csv()
	 .fromFile(fileNames[0])
	 .then((jsonObj)=>{
    	 console.log(jsonObj);
	 })
  }); // showOpenDialog
} // getCSVFile

function logger(format,...args)
{
  console.log('voter-manager.logger start');
  if(CliData.debug) {
    console.log('RENDER: ' + format, ...args);
  }
} // logger

