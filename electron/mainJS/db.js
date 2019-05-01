// basic code from https://medium.com/@shivekkhurana/persist-data-in-electron-apps-using-nedb-5fa35500149a
const {app} = require('electron');
const Datastore = require('nedb-promises');
const Settings = require('electron-settings');

const dbFactory = (fileName) => Datastore.create({
  filename: `${process.env.NODE_ENV === 'dev' ? '.' : ${fileName}`, 
  timestampData: true,
  autoload: true
});

const db = {
  voterDB: dbFactory(Settings.get('UVM.dbDir') + 'voters.nedb'),
  queries: dbFactory(Settings.get('UVM.dbDir') + 'queries.nedb')
};
module.exports = db;

