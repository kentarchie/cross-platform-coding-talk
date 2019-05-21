const Utilities=require('../mainJS/Utilities.js');
const {remote} = require('electron');
const {ipcRenderer} = require('electron');
const fsLib = require('fs');
const path = require('path');
const {dialog} = require('electron').remote;
const dateFormat = require('dateformat');
const csv=require('csvtojson');
const Settings = require('electron').remote.require('electron-settings');
//const DataStore = require('nedb');  
const DataStore = require('nedb-promises');  

let CliData = remote.getCurrentWindow().CliData; // parameters from the command line
let Utils = null;
let VotersDB = null;
let HouseholdsDB = null;
let AddressIndex = {};

let UserIDFields = ['Precinct','LastName','LastNameSuffix','FirstName','MiddleName','HouseNumber','Direction','StreetName','Unit','City','zip'];
let NumberFields = ['Age' ,'Congressional' ,'Senate' ,'Representative' ,'County_Forest_District' ];
let StatusFields = ['csvFileName', 'csvFileDate', 'numberOfRecords', 'numberOfFields'];
let TrackingFields = [
   {
      'name'  : 'Home-Talked'
      ,'type' : 'Boolean'
      ,'default' : false
   }
   ,{
      'name'  : 'NotHome'
      ,'type' : 'Boolean'
      ,'default' : false
   }
   ,{
      'name'  : 'NotHome-LeftLit'
      ,'type' : 'Boolean'
      ,'default' : false
   }
   ,{
      'name'  : 'Sign'
      ,'type' : 'String'
      ,'default' : 'No'
   }
   ,{
      'name'  : 'Donation'
      ,'type' : 'Number'
      ,'default' : 0
   }
];

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
		makeWalkList();
	});
	$('#saveWalkList').click((ev) => {
		saveWalkList();
	});

	$('#runAgeQuery').click((ev) => {
		Utils.logger('runAgeQuery clicked');
		VotersDB.find({ Age: { $lt: 50 }}, function(err, docs) {  
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
	let householdsDBFile = Settings.get('UVM.dbDir') + '/households.db';
	Utils.logger('ready: voterDBFile=:%s:',voterDBFile);
	Utils.logger('ready: householdsDBFile=:%s:',householdsDBFile);
	VotersDB = new DataStore({ 
			filename: voterDBFile
			,autoload: true
	});
	Utils.logger('ready: VotersDB created');
	if(VotersDB == null) Utils.logger('ready: VotersDB NULL');
	/*
	HouseholdsDB = new DataStore({ 
			filename: householdsDBFile
			,autoload: true
	});
	*/
	HouseholdsDB = DataStore.create({ 
			filename: householdsDBFile
			,autoload: true
	});
	HouseholdsDB.load();
	HouseholdsDB.ensureIndex({ fieldName: 'key', unique: true }, (err) => {
		Utils.logger('ready: HouseholdsDB index failed err=:%s:',err);
	});
	Utils.logger('ready: HouseholdsDB created');
}); // ready function

function setStatus()
{
	StatusFields.forEach((field) => {
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
 			  
    //$('#csvFileName').html(pathParts.base);
    $('#csvFileName').html(path.basename(chosenFile));
 
    // display number of records and number of fields per record
    let jsonObj = [];
    csv()
       .fromFile(chosenFile)
       .then((jsonObj)=>{ // jsonObj contains array of rows from csv file
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

function makeHouseholdKey(record)
{
	let householdKey = record['Address'].toLowerCase().replace(/\s/g,'');
	return householdKey;
} // makeHouseholdKey

function makeTrackingField(tracker,trackingFieldDef)
{
    let value = null;
    value = trackingFieldDef['default'];
    tracker[trackingFieldDef['name']] = value;
} // makeTrackingField

// change a string value to a number
function changeToNumber(record,field) 
{ 
	if(record[field] && (typeof record[field] == 'string')) {
		record[field] = Number(record[field]);
	}
} // changeToNumber

function makeAddressIndex(addressIndex,voter)
{
	let key = makeHouseholdKey(voter);
	if(key in addressIndex) {
 		Utils.logger('makeAddressIndex: repeated key :%s:', key);
		addressIndex[key]['names'].push(voter['LastName'] + '-' + voter['FirstName']);
	}
	else {
 		Utils.logger('makeAddressIndex: new key :%s:', key);
		let newData = new Object();
		newData['key'] = key;
		newData['address'] = voter['Address'];
		newData['names'] = [];
		newData['names'].push(voter['LastName'] + '-' + voter['FirstName']);
		AddressIndex[key] = newData;
      TrackingFields.forEach((field) => {
		   makeTrackingField(AddressIndex[key],field);
      });
	}
} // makeAddressIndex

function makeDB(jsonObj)
{
	Utils.logger('makeDB: START ');
   let dbDir = Settings.get('UVM.dbDir');
   let queriesDir = Settings.get('UVM.queriesDir');
	Utils.logger('makeDB: dbDir = :%s: queriesDir = :%s: jsonObj.length = %d',dbDir,queriesDir,jsonObj.length);
	let uidTable = {};
	let addressIndex = {};
   
   // add ids, covert number fields and add voter tracking fields
	for(var i=0; i< jsonObj.length; i++) {
		let uid = makeUID(jsonObj[i]);
		jsonObj[i]['uid'] = uid;
      NumberFields.forEach((field) => {
		   changeToNumber(jsonObj[i],field);
      });
		makeAddressIndex(addressIndex,jsonObj[i]);

      // make a map of uids to check if we have duplicates
		uidTable[uid] += (uidTable[uid]) ? `${uidTable[uid]}, ${i}` : -1;
	} // end of voter records update

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
		if( Settings.get('UVM.nedbCreated') || Settings.get('UVM.nedbLoaded')) { //DB exists
			if(window.confirm('Do you want to delete the current voter db, this cannot be undone')) {
				//Settings.set('UVM.nedbCreated',true) Settings.set('UVM.nedbLoaded',true)
				// remove existing DB
				VotersDB.remove({ },{ multi:true},
				function(err,numRemoved) {
					VotersDB.loadDatabase(function(err) {
						Utils.logger('makeDB: DB removed: number of deleted records = %d',numRemoved);
					})
					});
				} // confirm remove DB
		} // db already exists
//		VotersDB = new DataStore({ 
//			filename: Settings.get('UVM.dbDir') + '/voters.db'
//			,autoload: true
//		});
		Settings.set('UVM.nedbCreated',true);
		$('#dbStatus').html('Created');
		Utils.logger('makeDB: db created');
		for(var i=0; i< jsonObj.length; i++) {
			VotersDB.insert(jsonObj[i], function(err, doc) {  
    			if((i % 500) == 0) Utils.logger('makeDB: Inserted', doc.name, 'with ID', doc._id);
			});
		}

		// load Households DB
		let households = Object.keys(AddressIndex);
		for(var i=0; i< households.length; i++) {
			HouseholdsDB.insert(AddressIndex[households[i]], function(err, doc) {  
    			if((i % 500) == 0) Utils.logger('makeDB: Households Inserted', doc.key, 'with ID', doc._id);
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

function makeWalkList()
{
	Utils.logger('makeWalkList: START');
	let rows = [];
	HouseholdsDB.find({}).then(function() {  
	//HouseholdsDB.find({}, function(err, households) {  
		let households = arguments[0];
			Utils.logger('makeWalkList: households.length =:%d:',households.length);
			$('#totalAddressCount').html(households.length);
    		households.forEach(function(house) {
				let key = house['key'];
				//Utils.logger('makeWalkList: creating DOM for key :%s:',key);
      		let humanAddress = house['address'];
				rows.push(`<li class='walkList' />`); 
				rows.push(`<span class='address' data-address='${key}'>${humanAddress}</span>`); 
      		rows.push("</li>");
    		}); // docs loop
			$('#sourceAddressList').html(rows.join(''));
	}); // find
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

function getHousehold(li)
{
	let key = $(li).data('address');
	return HouseholdsDB.findOne({ 'key': key });
	/*
  		.then(() => {
      	Utils.logger('getHousehold: found key=:%s:',key);
			Utils.logger('getHousehold: getHousehold=:%s:',JSON.stringify(arguments[0],null,'\t'));
		  })
		  .catch()
		  */
} // getHousehold

function saveWalkList(ev)
{
	Utils.logger('saveWaLkList: START:');

	let defaultPath = Settings.get('UVM.walkLists');
	dialog.showSaveDialog(
		{
			defaultPath : defaultPath
    		,filters: [{
      		name: 'JSON',
      		extensions: ['json']
    		}]
  		},(fileName) => {
   			if (fileName === undefined){
        			console.log("You didn't choose a file");
        			return;
				}
				let newPath = path.dirname(fileName);
      		Utils.logger('saveWalkList: defaultPath=:%s: newPath = :%s:',defaultPath, newPath);
				if(newPath !== defaultPath) {
					if(window.confirm('Change the default folder for walk lists to '+ newPath)) {
						Settings.set('UVM.walkLists',newPath);
					}
				}

      		Utils.logger('saveWalkList: fileName=:%s:',fileName);
				let liList = $('#destAddressList li span'); 
   			let walkData = [];
				var promises = [];
   			liList.each((liIndex,li) => {
			 		let thisHouse = getHousehold(li);
					Utils.logger('saveWalkList: getHousehold=:%s:',JSON.stringify(thisHouse,null,'\t'));
			 		promises.push(thisHouse);
				});
				Promise.all(promises).then(function() {
    				// returned data is in arguments[0], arguments[1], ... arguments[n]
					// you can process it here
					Utils.logger('saveWalkList: arguments.length=:%d:',arguments.length);
					Utils.logger('saveWalkList: arguments[0]=:%s:',JSON.stringify(arguments[0],null,'\t'));
					let content = JSON.stringify(arguments[0],null,'\t');

   				// fileName is a string that contains the path and filename created in the save file dialog.  
   				fsLib.writeFile(fileName, content, (err) => {
      				if(err){
            			alert('An error ocurred creating the file '+ err.message)
      				}
   				});
				}, function(err) {
    				// error occurred
					});
		}); // end of showDialog
} // saveWalkList