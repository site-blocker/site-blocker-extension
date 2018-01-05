window.addEventListener('load', function(){
  /*
  ===============================
  GLOBAL VARIABLES
  ===============================
  */
  var button;
  var soundState = true;
  var repeatState = true;
  var timerState = 1;
  var settings;

  var timerStates = ['break', 'focus'];
  var noIds = ['hms','volume','repeat','fill'];
  var submitOptions = ['Stop', 'Start'];
  /*
  ===============================
  CLASSES
  ===============================
  */
  class Volume {
    constructor(soundState, buttonID, volID) {
      this.soundState = soundState;
      this.buttonID = buttonID;
      this.volID = volID;
    }
    volumeOff(){
      document.getElementById(this.buttonID).className = 'volume-off btn btn-default btn-xs';
      document.getElementById(this.volID).className = 'glyphicon glyphicon-volume-off';
    }
    volumeOn(){
      document.getElementById(this.buttonID).className = 'volume-on btn btn-info btn-xs';
      document.getElementById(this.volID).className = 'glyphicon glyphicon-volume-up';
    }
    set(){
      if (this.soundState) {
        this.volumeOn();
      }
      else {
        this.volumeOff();
      }
    }
    toggle(){
      if (this.soundState) {
        this.volumeOff();
        soundState = false;
      }
      else {
        this.volumeOn();
        soundState = true;
      }
      chrome.runtime.sendMessage({command: 'storeValue', value: {'volume': [soundState, this.buttonID, this.volID]}}, function(response){
        console.log(response);
        chrome.runtime.sendMessage({command: 'setSound'}, function(response){
          console.log(response.message);
        });
      })
    }
  }

  class Repeat {
    constructor(repeatState, repeatButtonID){
      this.repeatState = repeatState;
      this.repeatButtonID = repeatButtonID;
    }
    set(){
      if (this.repeatState) {
        document.getElementById(this.repeatButtonID).className = 'btn btn-info btn-xs';
      }
      else {
        document.getElementById(this.repeatButtonID).className = 'btn btn-default btn-xs';
      }
    }
    toggle(){
      if (this.repeatState) {
        document.getElementById(this.repeatButtonID).className = 'btn btn-default btn-xs';
        repeatState = false;
      }
      else {
        document.getElementById(this.repeatButtonID).className = 'btn btn-info btn-xs';
        repeatState = true;
      }
      chrome.runtime.sendMessage({command: 'storeValue', value: {'repeat': [repeatState, this.repeatButtonID]}}, function(response){
        console.log(response);
        chrome.runtime.sendMessage({command: 'setRepeat'}, function(response){
          console.log(response.message);
        });
      })
    }
  }
  /*
  ===============================
  LISTENERS AND INITIAL SETTINGS
  ===============================
  */
  getSettings();
  addMessageListeners();
  chrome.runtime.sendMessage({command: "updateTimerState", value: timerState});
  /*
  ===============================
  BUTTON PRESS ACTIONS
  ===============================
  */
  $(".button, #submit").mouseup(function(){
    $(this).blur();
  })
  $(".button, #f-in, #b-in").on("click", function() {
    var button = $(this)
    updateSettings(button);
  })
  $("#f-in, #b-in").on("keyup", function(e) {
    if (e.keyCode == 13 || e.which == 13){
      var button = $(this);
      updateSettings(button);
    }
  })
  $("#submit").on("click", function(){
    button = document.getElementById('submit').value;
    if (button === "Start"){
      timerControl(button);
      chrome.runtime.sendMessage({command: 'getSites'});
      console.log("Timer Started");
      button = document.getElementById('submit').value = 'Stop';
    }
    else {
      timerControl(button);
      chrome.runtime.sendMessage({command: 'getSites'});
      console.log("Timer Stopped");
      button = document.getElementById('submit').value = 'Start';
    }
  })
  $('#volume-btn').on('click', function (){
    var button = $(this);
    var volID = button.find('span').attr('id');
    var buttonID = button.attr('id')
    var volume = new Volume(soundState, buttonID, volID);
    volume.toggle();
  })
  $('#repeat-btn').on('click', function (){
    var button = $(this);
    var repeatButtonID = button.attr('id')
    var repeat = new Repeat(repeatState, repeatButtonID);
    repeat.toggle();
  })
  $('#refresh-btn').on('click', function (){
    timerControl('Stop');
    document.getElementById('submit').value = submitOptions[1];
    if (repeatState){
      document.getElementById("counter").innerHTML = settings['focus'][1] + ':00'
    }
    timerState = 1 - timerState;
    chrome.runtime.sendMessage({command: "updateTimerState", value: timerState});
    chrome.runtime.sendMessage({command: 'getSites'});

    var timeState = timerStates[timerState];
    var time = document.getElementsByClassName(timeState)[0].value + ':00';
    var elapsedTime = settings['fill'][3];
    var initialTime = settings['fill'][3];
    chrome.runtime.sendMessage({command: "storeValue", value: {'hms':['counter', time]}});
    updateTimer(time, elapsedTime, initialTime, timerState)
  })
  /*
  ===============================
  FUNCTIONS
  ===============================
  */
  // Update the focus and break times
  // Store the values
  // Change the value displayed in the timer
  function updateSettings(){
    for (var i = 0; i < arguments.length; i++) {
      var $button = arguments[i];
      var oldValue = $button.parent().find("input").val();
      var buttonClass = $button.attr('class').split(/\s+/);

      function checkClass(term){
        return buttonClass.includes(term)
      }

      if (oldValue > 3600){
        var newVal = 3600;
        break
      }
      if (oldValue < 1){
        var newVal = 1;
        break
      }
      switch (true){
        case checkClass("inc"):
        if (oldValue == 3600){
          var newVal = parseInt(oldValue);
          break
        }
          var newVal = parseInt(oldValue) + 1;
          break
        case checkClass("dec"):
          if (oldValue == 1){
              var newVal = parseInt(oldValue)
              break
          }
          var newVal = parseInt(oldValue) - 1;
          break
        default:
          var newVal = parseInt(oldValue);
      }
    }
    $button.parent().find("input").val(newVal);
    var id = $button.parent().find("input").attr('id');
    var classList = $button.parent().find("input").attr('class').split(/\s+/);
    storeValue(id, classList[0]);
  }
  // Add message listeners to pickup commands from background scripts
  function addMessageListeners(){
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
      switch (request.command) {
        case 'updateTimer':
          var time = request.time;
          var elapsedTime = request.elapsedTime;
          var initialTime = request.initialTime;
          timerState = request.timerState;
          updateTimer(time, elapsedTime, initialTime, timerState);
          sendResponse({message: "Timer Updated"});
          break
        case 'setSubmit':
          var value = submitOptions[request.value];
          button = document.getElementById('submit').value = value;
          break
      }
    });
  }
  // Start and stop the timer
  // Toggle the start/stop button and store the value
  function timerControl(state){
    if(state === 'Start'){
      chrome.runtime.sendMessage({command: "startTimer"}, function(response){
        console.log(response.message);
        storeValue('submit', 'submit');
      })
    }
    else {
      chrome.runtime.sendMessage({command: "stopTimer"}, function(response){
        console.log(response.message);
        storeValue('submit', 'submit');
        chrome.browserAction.setBadgeText({text: ''});
      })
    }
  }
  // Change the value displayed in the timer
  // Fill the circle
  // Store the values
  function updateTimer(time, elapsedTime, initialTime, timerState){
    var time = time;
    var elapsedTime = elapsedTime;
    var initialTime = initialTime;
    timerState = timerState;
    var percent = 100*((initialTime - elapsedTime)/initialTime);
    document.getElementById("counter").innerHTML = time;
    fillCircle(timerState, time, elapsedTime, initialTime);
    chrome.runtime.sendMessage({command: 'storeValue', value: {'fill': [timerState, time, elapsedTime, initialTime]}}, function(response){
      console.log(response);
    });
  }
  // Store the value of element passed
  function storeValue(id, name){
    var object = {};
    var name = name;
    var id = id;
    var val = document.getElementById(id).value;
    object[name] = [id,val];
    chrome.runtime.sendMessage({command: "storeValue", value: object}, function(response){
      var state = timerStates[timerState];
      document.getElementById("counter").innerHTML = object[state][1] + ':00';
      chrome.runtime.sendMessage({command: "storeTime", value: {'hms': ['counter', document.getElementById("counter").innerHTML]}})
    });
  }
  // Set the timer time
  function setTime(){
    chrome.runtime.sendMessage({command: "getTime"}, function(response){
      if (response.hms){
        var counterDOM = document.getElementById("counter");
        var counter = counterDOM.innerHTML = response.hms[1];
      }
    });
  }
  // Fill the circle
  // Green in focus and red in break
  function fillCircle(timerState, time, elapsedTime, initialTime){
    var percent = 100*((initialTime - elapsedTime)/initialTime);
    switch (timerState){
      case 1:
        if(percent <= 100){
          $('.timer').css({background: "linear-gradient(to top, #2ecc71 "+percent+"%,transparent "+percent+"%,transparent 100%)"});
        }
        break
      case 0:
        if(percent <= 100){
          $('.timer').css({background: "linear-gradient(to top, #E74C3C "+percent+"%,transparent "+percent+"%,transparent 100%)"});
        }
        break
    }
  }
  // Get the settings from background.js
  // Populate the circle, timer, break and focus times
  // Get state of the buttons
  function getSettings(){
    chrome.runtime.sendMessage({command: "getSettings"}, function(response){
      settings = response.settings;
      if (settings == null || settings['hms'][1] === '0:00'){
        getSettings();
      }
      console.log('getSettings: ' + Object.entries(settings));

      document.getElementById("counter").innerHTML = settings['hms'][1];

      soundState = settings['volume'][0];
      repeatState = settings['repeat'][0];
      timerState = settings['fill'][0];

      var buttonID = settings['volume'][1];
      var volID = settings['volume'][2];
      var repeatButtonID = settings['repeat'][1];
      var time = settings['fill'][1];
      var elapsedTime = settings['fill'][2];
      var initialTime = settings['fill'][3];

      fillCircle(timerState, time, elapsedTime, initialTime);

      for (var name in settings){
        if (noIds.includes(name)) {
          continue
        }
        var id = settings[name][0];
        var val = settings[name][1];
        document.getElementById(id).value = val;

        var volume = new Volume(soundState, buttonID, volID);
        volume.set();

        var repeat = new Repeat(repeatState, repeatButtonID)
        repeat.set();
      }
    })
  }
})
