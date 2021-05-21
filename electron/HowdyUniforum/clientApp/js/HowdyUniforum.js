document.addEventListener("DOMContentLoaded", function()
{
	var nodeVersion =     (process && process.versions) ? process.versions.node : 'unknown';
	var chromeVersion =   (process && process.versions) ? process.versions.chrome : 'unknown';
	var electronVersion = (process && process.versions) ? process.versions.electron : 'unknown';

   document.getElementById('nodeVersion').innerHTML = nodeVersion;
   console.log('Client: node version set');
   document.getElementById('chromeVersion').innerHTML = chromeVersion;
   console.log('Client: chrome version set');
   document.getElementById('electronVersion').innerHTML = electronVersion;
   console.log('Client: electron version set');

   document.getElementById('thisButton').addEventListener("click",thisButton,false);
});
