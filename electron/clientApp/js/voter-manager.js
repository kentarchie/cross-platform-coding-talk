const Constants=require('../mainJS/constants.js');
const Utilities=require('../mainJS/Utilities.js');
const {remote} = require('electron');
const {ipcRenderer} = require('electron');
const fsLib = require('fs');
const pathLib = require('path');
const {dialog} = require('electron').remote;
const dateFormat = require('dateformat');
const csv=require('csvtojson');
const Settings = require('electron').remote.require('electron-settings');

let CliData = remote.getCurrentWindow().CliData; // parameters from the command line
let Utils = null;

$(document).ready(function()
{
	Utils = new Utilities(CliData);
	Utils.logger('ready: START ');
	//Utils.logger('ready: this is :%s:', (Utils.isMain()) ? 'Main' : 'Renderer');

  ipcRenderer.on('create-voter-db', (event, arg) => {
    Utils.logger('ready: great-voter-db received');
    getCSVFile();
    Utils.logger('ready: voter db setup');
  });
		  
  var copyRightYear = new Date().getFullYear();
  Utils.logger('init:  copyRightYear=:%s:',copyRightYear);
  $('.copyright span').html(copyRightYear);

	$('#loadingBlock').hide();
	$('#controls').css('display','show');

	setStatus();
	Utils.logger('ready: FINISHED ');
}); // ready function

function setStatus()
{
	let fields = [ 'csvFileName', 'csvFileDate', 'numberOfRecords', 'numberOfFields'];

	fields.forEach((field) => {
		Utils.logger('setStatus: field=:%s:',field);
		if(Settings.has(field)) {
			let value = Settings.get(field);
			Utils.logger('setStatus: has field=:%s: value = :%s:',field,value);
			$('#'+field).html(value);
		}
		else {
			$('#'+field).html('');
  			if(CliData.debug || CliData.rdebug) $('#'+field).html('MISSING');
		}
	});
} // setStatus

// let the user select a CSV file and parse it into JSON
// also update the status display
function getCSVFile () 
{
    dialog.showOpenDialog((fileNames) => {
    // fileNames is an array that contains all the selected
    if(fileNames === undefined){
        Utils.logger("No file selected");
        return;
    }
	 if(fileNames.length == 0) {
	    Utils.logger('No file selected');
	    return;
	 }
	 Utils.logger('ready: file selected =:%s:',fileNames[0]);
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
			    //Utils.logger('jsonObj[0]: ' + JSON.stringify(jsonObj[0],null,'\t'));
	    })
  }); // showOpenDialog
} // getCSVFile
