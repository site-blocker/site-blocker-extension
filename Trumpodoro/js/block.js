window.addEventListener('load', function(){

  var paragraphs = [
   "Money was never a big motivation for me, except as a way to keep score. \n\n If want to continue to this website, donate to my campaign.",
    "This website is blocked to keep you focused \n\n If you would like to continue, please make a donation to the Trump Administration.",
    "I don’t make deals for the money. I’ve got much more than I’ll ever need. \n\n If want to continue to this website, donate to my campaign first. Don’t be cheap."
    "SAD!\n\n If want to continue to this website, donate to my campaign."
  ]

  var message = paragraphs[Math.floor(Math.random()*paragraphs.length)]
  // document.getElementById('blocked-message').innerHTML = message

  function donationPopup(){
    alert(message);
  };


 donationPopup();

})
