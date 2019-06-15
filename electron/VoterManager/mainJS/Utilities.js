const Constants=require('./constants.js');
const electron = require('electron');

class Utilities {
  constructor(cli) {
	 this.cli = cli;
	 this.isMainProcess = this.isMain();
    const userDataPath = (electron.app || electron.remote.app).getPath('userData');
    console.log('console.log: Utilities.constructor: userDataPath = :%s:',userDataPath);
  } // constructor

	// lifted from is-electron npm package
	isMain() 
	{
		let one = typeof window !== 'undefined';
		let two = one && typeof window.process === 'object';
		let three = one && window.process.type === 'renderer';
		//console.log('Utilities.isMain: one is :' + one + ':');
		//console.log('Utilities.isMain: two is :' + two + ':');
		//console.log('Utilities.isMain: three is :' + three + ':');
		if(one && two && three) {
			console.log('Utilities.isMain: renderer');
			return false
		}

		let four = typeof process !== 'undefined';
		let five = typeof process.versions === 'object';
		let six = !! process.versions.electron;
		//console.log('Utilities.isMain: four is :' + four + ':');
		//console.log('Utilities.isMain: five is :' + five + ':');
		//console.log('Utilities.isMain: six is :' + six + ':');
		if(four && five && six) {
			console.log('Utilities.isMain: main');
			return true;
		}

		console.log('Utilities.isMain: Both');
		return true;
	} // isMain

	logger(format,...args)
	{
		//console.log('Utilities.logger start');
		let label = (this.isMainProcess) ? 'MAIN' : 'RENDERER';
		//console.log('Utilities.logger label = :%s:',label);
		console.log(label + ': ' + format, ...args);
	} // logger
} // class

// expose the class
module.exports = Utilities;
