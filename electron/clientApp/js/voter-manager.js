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
const DataStore = require('nedb');  

let CliData = remote.getCurrentWindow().CliData; // parameters from the command line
let Utils = null;
let UserIDFields = ["Precinct","LastName","LastNameSuffix","FirstName","MiddleName","HouseNumber","Direction","StreetName","Unit","City","zip"];
let VoterDB = null;
let AddressIndex = {};

const UNIQUE_ADDRESSES = {
   locale: 'en_US'
   ,strength: 3
   ,caseLevel: false
   ,caseFirst: 'off' 
   ,numericOrdering: false
   ,alternate: 'non-ignorable'
   ,backwards: false
};

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
  $('#saveWalkList').prop("disabled",true);
		  
  var copyRightYear = new Date().getFullYear();
  Utils.logger('init:  copyRightYear=:%s:',copyRightYear);
  $('.copyright span').html(copyRightYear);

	$('#loadingBlock').hide();
	$('#controls').css('display','show');

	$('#selectWalkListDir').click((ev) => {
		selectWalkListDir();
	});

	$('.addressList').click((ev) => {
		selectAddress(ev);
		Utils.logger('ready: selectAddress attached');
	});

	$('#makeWalkList').click((ev) => {
		//$('#saveWalkList').prop("disabled",true);
		loadAddresses();
	});
	$('#saveWalkList').click((ev) => {
		saveWalkList();
	});

	$('#runAgeQuery').click((ev) => {
		Utils.logger('runAgeQuery clicked');
		voterDB.find({ Age: { $lt: 50 }}, function(err, docs) {  
    		docs.forEach(function(d) {
      		Utils.logger('runAgeQuery: address:', d.Address);
				$('#queryResults').html( $('#queryResults').html() + d.Address + '<br />')
    		});
		});
	});

	setStatus();
	Utils.logger('ready: FINISHED ');
	Settings.set('UVM.dbSavePath','');
	tabSetup();

	let voterDBFile = Settings.get('UVM.dbDir') + '/voters.db';
	if (fsLib.existsSync(voterDBFile)) { 
		voterDB = new DataStore({ 
			filename: Settings.get('UVM.dbDir') + '/voters.db'
			,autoload: true
		});
	} 
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
       		 makeDB(jsonObj);
			    //Utils.logger('jsonObj[0]: ' + JSON.stringify(jsonObj[0],null,'\t'));
	    });
  }); // showOpenDialog
} // getCSVFile

function makeUID(record)
{
	let uid = '';
	for(var j=0; j< UserIDFields.length; j++) {
		uid += record[UserIDFields[j]];
	}
	uid = uid.toLowerCase();
	return uid;
} // makeUID

function changeToNumber(record,field) 
{ 
	if(record[field] && (typeof record[field] == 'string')) {
		record[field] = Number(record[field]);
	}
} // changeToNumber

function makeDB(jsonObj)
{
	Utils.logger('makeDB: START ');
   let dbDir = Settings.get('UVM.dbDir');
   let queriesDir = Settings.get('UVM.queriesDir');
	Utils.logger('makeDB: dbDir = :%s: queriesDir = :%s: jsonObj.length = %d',dbDir,queriesDir,jsonObj.length);
	let uidTable = {}
	for(var i=0; i< jsonObj.length; i++) {
		let uid = makeUID(jsonObj[i]);
		jsonObj[i]['uid'] = uid;
		changeToNumber(jsonObj[i],'Age');
		changeToNumber(jsonObj[i],'Congressional');
		changeToNumber(jsonObj[i],'Senate');
		changeToNumber(jsonObj[i],'Representative');
		changeToNumber(jsonObj[i],'County_Forest_District');
		//Utils.logger('makeDB: uid = %s',uid);

		uidTable[uid] += (uidTable[uid]) ? `${uidTable[uid]}, ${i}` : -1;
	}
	let numberIds = Object.keys(jsonObj).length;
	let dupIds = 0;
	let keys = Object.keys(uidTable);
	for(var i=0; i< keys.length; i++) {
		if(uidTable[keys[i]].toString().includes(',')) {
			dupIds++;
			Utils.logger('makeDB: dup uid = :%s: count = %d',keys[i],uidTable[keys[i]]);
		}
	}
	Utils.logger('makeDB: dup count = %d uidTable.length = %d',dupIds,numberIds);
	if(dupIds === 0) {
		if( Settings.get('UVM.nedbCreated') || Settings.get('UVM.nedbLoaded')) {
			if(window.confirm('Do you want to delete the current voter db, this cannot be undone')) {
				//Settings.set('UVM.nedbCreated',true) Settings.set('UVM.nedbLoaded',true)
				// remove existing DB
				voterDB.remove({ },{ multi:true},
				function(err,numRemoved) {
					voterDB.loadDatabase(function(err) {
						Utils.logger('DB removed numRemoved = %d',numRemoved);
					})
					});
				} // confirm remove DB
		} // db already exists
		voterDB = new DataStore({ 
			filename: Settings.get('UVM.dbDir') + '/voters.db'
			,autoload: true
		});
		Settings.set('UVM.nedbCreated',true);
		$('#dbStatus').html('Created');
		Utils.logger('makeDB: db created');
		for(var i=0; i< jsonObj.length; i++) {
			voterDB.insert(jsonObj[i], function(err, doc) {  
    			if((i % 500) == 0) Utils.logger('makeDB: Inserted', doc.name, 'with ID', doc._id);
			});
		}
		Settings.set('UVM.nedbLoaded',true);
		Utils.logger('makeDB: db loaded');
		$('#dbStatus').html('Loaded');
	}
	else {
		Utils.logger('makeDB: DB creation failed due to duplicate ids');
	}
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

// Walk Lists

function selectWalkListDir()
{
    var path = dialog.showOpenDialog(
	 	{ properties: ['openDirectory'] }
	 	,(fileNames) => {
    	// fileNames is an array that contains all the selected
    	if(fileNames === undefined){
        	Utils.logger("selectWalkListDir: No folder selected");
        	return;
    	}
	 	if(fileNames.length == 0) {
	    	Utils.logger('selectWalkListDir: No folder selected');
	    	return;
	 	}
    	let chosenDir = fileNames[0];
	 	Utils.logger('selectWalkListDir: folder selected =:%s:',chosenDir);
		$('#walkListDir').html(chosenDir);
	 }); // folder selection
	 Utils.logger('selectWalkListDir: path =:%s:',path);
} // selectWalkListDir

function loadAddresses()
{
	voterDB.find({}, function(err, docs) {  
			Utils.logger('loadAddresses: docs.length =:%d:',docs.length);
			$('#totalAddressCount').html(docs.length);
    		docs.forEach(function(d) {
				let key = d['Address'].toLowerCase().replace(/\s/g,'');
      		//Utils.logger('loadAddresses: :%s:', key);
				if(key in AddressIndex) {
					AddressIndex[key]['names'].push(d['LastName'] + '-' + d['FirstName']);
      			//Utils.logger('loadAddresses: added another name');
				}
				else {
      			//Utils.logger('loadAddresses: adding new name');
					let newData = new Object();
					newData['address'] = d['Address'];
					newData['names'] = [];
					newData['names'].push(d['LastName'] + '-' + d['FirstName']);
					AddressIndex[key] = newData;
				}
    		}); // docs loop
			Utils.logger('loadAddresses: FINAL num unique addresses =:%d:',Object.keys(AddressIndex).length);
			makeWalkList();
	}); // find
} // loadAddresses

function makeWalkList()
{
	Utils.logger('makeWalkList: START');
	if(Object.keys(AddressIndex).length == 0) {
		loadAddresses();
		Utils.logger('makeWalkList: loadAddresses DONE');
	}
	let rows = [];
	for (var key in AddressIndex) {
      let humanAddress = AddressIndex[key]['address'];
		rows.push(`<li class='walkList' />`); 
		rows.push(`<span class='address' data-address='${key}'>${humanAddress}</span>`); 
      rows.push("</li>");
	}
	$('#sourceAddressList').html(rows.join(''));
} // makeWalkList

function selectAddress(ev)
{
    Utils.logger('selectAddress: START:');
	 let selectedCount = parseInt($('#selectedAddressCount').html());
    let key = ev.target.dataset['address'];
	 let target = $(ev.target);
	 let humanAddress = target.html();
    Utils.logger('selectAddress: data key=:%s:',key);
	 let li = $("<li class='walkList newLI' />"); 
	 let span = $(`<span class='address' data-address='${key}'>${humanAddress}</span>`).appendTo(li); 
	 li.appendTo('#destAddressList'); 

	 target.fadeOut( "slow", function() {
	 	li.fadeIn( "slow", function() {
			$('#selectedAddressCount').html(selectedCount+1);
	 		$('#saveWalkList').prop("disabled",false)
		                  .css("background-color",'lightgreen');
  	 	});
  	 });
} // selectAddress

function saveWalkList(ev)
{
	Utils.logger('saveWaLkList: START:');
} // saveWalkList
