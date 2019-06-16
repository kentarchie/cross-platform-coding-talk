document.addEventListener("DOMContentLoaded", function()
{
      document.getElementById('nodeVersion').innerHTML = process.versions.node;
      console.log('node version set');
      document.getElementById('chromeVersion').innerHTML = process.versions.chrome;
      console.log('chrome version set');
      document.getElementById('electronVersion').innerHTML = process.versions.electron;
      console.log('electron version set');

      document.getElementById('thisButton').addEventListener("click",thisButton,false);

});
