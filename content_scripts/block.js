(function () {
  function ready() {
    if(!document.getElementById('matchu-pomodoro-extension-overlay')) {
      var overlay = document.createElement('div'), lines = [
        chrome.i18n.getMessage("site_blocked_info"),
        chrome.i18n.getMessage("site_blocked_motivator"),
        "Alternatively, you could donate to a charity today to get access now."
      ], p, underlayEls, img = document.createElement('img');

      overlay.id = 'matchu-pomodoro-extension-overlay';
      overlay.style.position = 'fixed';
      overlay.style.left = 0;
      overlay.style.top = 0;
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.zIndex = 9000001;
      overlay.style.backgroundImage = '-webkit-linear-gradient(bottom, rgba(210, 210, 210, 0.9) 0%, rgba(255, 255, 255, 0.95) 75%)';
      overlay.style.padding = '5em 0 1em';
      overlay.style.textAlign = 'center';
      overlay.style.color = '#000';
      overlay.style.font = 'normal normal normal 16px/1 sans-serif';
      
      img.src = chrome.extension.getURL('icons/work_full.png');
      img.style.marginBottom = '2em';
      // img.style.width = '100%';
      // img.style.height = '100%';
      overlay.appendChild(img);
      
      for(var i in lines) {
        p = document.createElement('p');
        p.innerText = lines[i];
        p.style.margin = '0 0 1em 0';
        p.style.fontSize = "x-large";
        overlay.appendChild(p);
      }
      document.body.appendChild(overlay);
      
      var button = document.createElement("button");
      overlay.appendChild(button);
      button.innerHTML = "Donate";
      button.style.fontSize = "large";
      button.style.width = "200px"
      button.style.height = "50px"
      button.style.color = '#FF4127';
      
      button.addEventListener ("click", function() {
        alert("exchange made");

        chrome.tabs.executeScript(null,
          {file:"/unblock.js"});


      });


//       <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
// <input type="hidden" name="cmd" value="_s-xclick">
// <input type="hidden" name="hosted_button_id" value="JFZ4LL8WR895J">
// </form>




      // Add a minimal blur effect to the blocked page
      underlayEls = document.querySelectorAll("body > *:not(#matchu-pomodoro-extension-overlay)");
      for(var i in underlayEls) {
        if (underlayEls[i].style) {
          underlayEls[i].style.webkitFilter = "grayscale(0.5) blur(4px)";
        }
      }

      document.body.style.overflow = "hidden"; // Hide horizontal and vertical scrollbars
    }
  }
  
  if(typeof document === 'undefined') {
    window.addEventListener("DOMContentLoaded", ready);
  } else {
    ready();
  }
})();



