const Constants=require('../mainJS/constants.js');
const {remote} = require('electron');
const {ipcRenderer} = require('electron');
const fsLib = require('fs');
const pathLib = require('path');
const {dialog} = require('electron').remote;
const dateFormat = require('dateformat');
const csv=require('csvtojson');
const Settings = require('electron').remote.require('electron-settings');
//const ManageConfig = require('../mainJS/config.js');

let CliData = remote.getCurrentWindow().CliData; // parameters from the command line

//let Config = new ManageConfig({ });

$(document).ready(function()
{
	logger('ready: START ');
	//logger('ready: this is :%s:', (Config.isMain()) ? 'Main' : 'Renderer');

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

	setStatus();
	logger('ready: FINISHED ');
}); // ready function

function setStatus()
{
	let fields = [ 'csvFileName', 'csvFileDate', 'numberOfRecords', 'numberOfFields'];

	fields.forEach((field) => {
		logger('setStatus: field=:%s:',field);
		if(Settings.has(field)) {
			let value = Settings.get(field);
			logger('setStatus: has field=:%s: value = :%s:',field,value);
			$('#'+field).html(value);
		}
		else {
			$('#'+field).html('');
  			if(CliData.debug || CliData.rdebug) $('#'+field).html('MISSING');
		}
	});
	//if(Settings.has('csvFileDate')) $('#csvFileDate').html(Settings.get('csvFileDate'));
	//if(Settings.has('numberOfRecords')) $('#numberOfRecords').html(Settings.get('numberOfRecords'));
	//if(Settings.has('numberOfFields')) $('#numberOfFields').html(Settings.get('numberOfFields'));
} // setStatus

// let the user select a CSV file and parse it into JSON
// also update the status display
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
	 Settings.set('csvFileName',fileNames[0]);

    let pathParts = pathLib.parse(fileNames[0]);
    let fileStats = fsLib.statSync(fileNames[0]);

    // display last modification date like 1st April, 2019
    let formatted = dateFormat( new Date(fileStats.mtime), "dS mmmm, yyyy");
	 $('#csvFileDate').html(formatted);
	 Settings.set('csvFileDate',formatted);
			  
    $('#csvFileName').html(pathParts.base);

    // display number of records and number of fields per record
	  let jsonObj = [];
	  csv()
	    .fromFile(fileNames[0])
	    .then((jsonObj)=>{
		      $('#numberOfRecords').html(jsonObj.length);
			    $('#numberOfFields').html(Object.keys(jsonObj[0]).length);
				 Settings.set('numberOfRecords',jsonObj.length);
				 Settings.set('numberOfFields',Object.keys(jsonObj[0]).length);
			    //console.log('jsonObj[0]: ' + JSON.stringify(jsonObj[0],null,'\t'));
	    })
  }); // showOpenDialog
} // getCSVFile

function logger(format,...args)
{
  //console.log('voter-manager.logger start');
  if(CliData.debug || CliData.rdebug) {
    console.log('RENDER: ' + format, ...args);
  }
} // logger
