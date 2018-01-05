window.addEventListener('load', function(){

  var paragraphs = [
    // "I'm Not Mad, I'm Just Disappointed",
    // "Like You, fruit flies also have a short attention span",
    // "You deserve this",
    // "Studies show that humans now have a shorter attention span than goldfish",
    // "I'm judging you",
    // "Remember when you were working on that thing just now?",
    // "Ya I hate being productive too"
    "This website is blocked to keep you focused! If you would like to continue, please make a donation to the Trump Administration."
  ]

  var message = paragraphs[Math.floor(Math.random()*paragraphs.length)]
  // document.getElementById('blocked-message').innerHTML = message

  function donationPopup(){
    alert(message);
  };


 donationPopup();

})
