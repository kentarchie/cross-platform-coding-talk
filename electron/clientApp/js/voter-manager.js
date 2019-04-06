const {remote} = require('electron');
const { ipcRenderer } = require('electron')
const fsLib = require('fs');
const pathLib = require('path');
const {dialog} = require('electron').remote;
var dateFormat = require('dateformat');
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

	$('#loadingBlock').hide();
	$('#controls').css('display','show');
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
    let pathParts = pathLib.parse(fileNames[0]);
    let fileStats = fsLib.statSync(fileNames[0]);

    let formatted = dateFormat( new Date(fileStats.mtime), "dS mmmm, yyyy");
		$('#csvFileDate').html(formatted);
			  
	  $('#csvFileName').html(pathParts.base);
	  let jsonObj = [];
	  csv()
	    .fromFile(fileNames[0])
	    .then((jsonObj)=>{
		      $('#numberOfRecords').html(jsonObj.length);
			    $('#numberOfFields').html(Object.keys(jsonObj[0]).length);
			    //console.log('jsonObj[0]: ' + JSON.stringify(jsonObj[0],null,'\t'));
	    })
  }); // showOpenDialog
} // getCSVFile

function logger(format,...args)
{
  //console.log('voter-manager.logger start');
  if(CliData.debug) {
    console.log('RENDER: ' + format, ...args);
  }
} // logger

