const Constants=require('../mainJS/constants.js');
const Utilities=require('../mainJS/Utilities.js');
const {remote} = require('electron');
const {ipcRenderer} = require('electron');
const fsLib = require('fs');
const path = require('path');
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
	Settings.set('UVM.dbSavePath','');
	tabSetup();
}); // ready function

function setStatus()
{
	let fields = [ 'csvFileName', 'csvFileDate', 'numberOfRecords', 'numberOfFields'];

	fields.forEach((field) => {
		Utils.logger('setStatus: field=:%s:',field);
		if(Settings.has('UVM.' + field)) {
			let value = Settings.get('UVM.' + field);
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
    let chosenFile = fileNames[0];
	 Utils.logger('ready: file selected =:%s:',chosenFile);
	 Settings.set('UVM.csvFileName',chosenFile);

    let pathParts = path.parse(chosenFile);
    let fileStats = fsLib.statSync(chosenFile);

    // display last modification date like 1st April, 2019
    let formatted = dateFormat( new Date(fileStats.mtime), "dS mmmm, yyyy");
	 $('#csvFileDate').html(formatted);
	 Settings.set('UVM.csvFileDate',formatted);
			  
    $('#csvFileName').html(pathParts.base);

    // display number of records and number of fields per record
	  let jsonObj = [];
	  csv()
	    .fromFile(chosenFile)
	    .then((jsonObj)=>{
		      $('#numberOfRecords').html(jsonObj.length);
			    $('#numberOfFields').html(Object.keys(jsonObj[0]).length);
				 Settings.set('UVM.numberOfRecords',jsonObj.length);
				 Settings.set('UVM.numberOfFields',Object.keys(jsonObj[0]).length);
			    //Utils.logger('jsonObj[0]: ' + JSON.stringify(jsonObj[0],null,'\t'));
	    });
       makeDB(jsonObj);
  }); // showOpenDialog
} // getCSVFile

function makeDB(jsonObj)
{
	Utils.logger('makeDB: START ');
   let dbDir = Settings.get('UVM.dbDir');
   let queriesDir = Settings.get('UVM.queriesDir');
	Utils.logger('makeDB: dbDir = :%s: queriesDir = :%s:',dbDir,queriesDir);
} // makeDB

function tabSetup()
{
	$('#tabs li a:not(:first)').addClass('inactive');
	$('.tabBlock').hide();
	$('.tabBlock:first').show();
    
	$('#tabs li a').click(function()
	{
		var t = $(this).attr('id');
  		if($(this).hasClass('inactive')) { //this is the start of our condition 
    		$('#tabs li a').addClass('inactive');           
    		$(this).removeClass('inactive');
    
    		$('.tabBlock').hide();
    		$('#'+ t + 'C').fadeIn('slow');
 		}
	});
} // tabSetup
