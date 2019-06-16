let counter = 0;
function thisButton(ev) 
{
	   console.log('thisButton clicked');
	   // Don't follow the link
	   event.preventDefault();

	   // Log the clicked element in the console
	   console.log(ev.target);

      counter++;
      let button = document.getElementById('thisButton');
      let origFontSize = button.style.fontSize;

      if(counter == 1) {
         button.style.color = 'coral';
         button.innerHTML='What did I just tell you!'
      }
      if(counter == 2) {
         button.style.fontSize = 18;
         button.style.color = 'red';
         button.innerHTML='I am not kidding'
      }
      if(counter == 3) {
         document.getElementsByTagName('ul')[0].style.backgroundColor = 'black';
         button.style.fontSize = 24;
         button.style.color = 'blue';
         button.innerHTML='I told you'
      }
      if(counter == 6) {
         document.getElementsByTagName('ul')[0].style.backgroundColor = 'white';
         button.style.fontSize = origFontSize;
         button.style.color = 'black';
         button.innerHTML="Don't Press This"
         counter = 0;
      }
} // jokeButton
