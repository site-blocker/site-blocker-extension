window.addEventListener('load', function(){

  var currentState = false;
  var hms;
  var settings;
  var timer;
  var timerState = 1;
  var soundState = true;
  var repeatState = true;
  var timerStates = ['break', 'focus'];
  var badgeColors = ['#E74C3C', '#3498DB']
  var initialTime;
  var currentTime;

  var defaults = {
    'focus': ['f-in', 25],
    'break': ['b-in', 5],
    'submit': ['submit', 'Start'],
    'hms': ['counter', '25:00'],
    'volume': [1, 'volume-btn', 'volume-icon'],
    'repeat': [1, 'repeat-btn'],
    'fill': [1, 25, 25*60, 25*60]
  }
  var focusMessage = [
    'Get back to working on something great!',
    'Get in the zone!',
    'Time to start inventing the future!',
    'All of your power is focused on your task; there are no distractions',
    'Put on those headphones and get lost in your work!',
  ];
  var breakMessage = [
    'Take some time to relax, and reflect on what you\'ve worked on.',
    'Have a zen moment.',
    'Get away from work for a little bit and unwind.',
    'Take some time to de-stress.',
    'Relax your mind and consolidate the what you\'ve done'
  ]

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    switch (request.command) {

      case 'storeValue':
        var value = request.value;
        storeValue(value);
        sendResponse({message: 'Value Stored'});
      case 'storeTime':
        storeTime(request.value);
        sendResponse({message: 'Time Stored'});
      case 'getTime':
        getTime();
        sendResponse({'hms': hms});
      case 'getSettings':
        getSettings();
        sendResponse({'settings': settings});
      case 'setSound':
        setSound();
        sendResponse({message: 'Sound State Saved'});
      case 'setRepeat':
        setRepeat();
        sendResponse({message: 'Repeat State Saved'});
  }
    if (request.command === "stopTimer" && currentState){
      currentState = false;
      handleTimer(currentState);
      sendResponse({message: "Stopping Timer"});
    }

    else if (request.command === "startTimer" && !currentState){
      currentState = true;
      handleTimer(currentState);
      sendResponse({message: "Starting Timer"});
    }

    else if (request.command === 'updateTimerState'){
      timerState = request.value;
      handleTimerState(timerState);
    }
  })

  function handleTimer(currentState){
    getSettings();
    var timeState = timerStates[timerState];
    chrome.browserAction.setBadgeBackgroundColor({color: badgeColors[timerState]});

    if (currentState){
      if (repeatState) {
        var initialTime = settings[timeState][1]*60;
        handleOn(initialTime);
      }
      else {
        var initialTime = hmstoSeconds(settings['hms'][1]);
        handleOn(initialTime);
      }
    }
    else {
      if (repeatState){
        timerState = 1;
        handleTimerState(timerState)
        var time = settings['focus'][1]*60;
        var hms = secondsToHms(time);
        clearInterval(timer);
        chrome.runtime.sendMessage({command: "updateTimer", "time": hms, "elapsedTime": time, "initialTime":time, "timerState": timerState});
        storeTime({'hms': ['counter', hms]});
        chrome.browserAction.setBadgeText({text: hms});
      }
      else {
        handleTimerState(timerState)
        clearInterval(timer);
      }
    }
  }

  function handleOn(initialTime){
    handleTimerState(timerState)
    var start = moment();
    timer = setInterval(function(){
      var diff = moment().diff(start, 'seconds');
      var seconds = initialTime - diff;
      currentTime = secondsToHms(seconds);
      storeTime({'hms': ['counter', currentTime]});
      chrome.runtime.sendMessage({command: "updateTimer", "time": currentTime, "elapsedTime": seconds, "initialTime":initialTime, "timerState": timerState});
      chrome.browserAction. setBadgeText({text: currentTime});
      var zero = zeroCheck();
      if (zero){
        if (repeatState){
          handleOff();
        }
        else {
          handleRepeat()
        }
      }
    }, 1000);
  }

  function handleOff(){
    clearInterval(timer);
    notifyUser(timerState, soundState);
    handleTimerState(timerState, true)
    handleTimer(currentState);
  }

  function handleRepeat(){
    getSettings();
    switch (repeatState){
      case false:
        clearInterval(timer);
        currentState = false;
        storeValue({'submit': ['submit', 'Start']})
        chrome.runtime.sendMessage({command: 'setSubmit', value: 1});
        notifyUser(timerState, soundState);

        handleTimerState(timerState, true)
        var timeState = timerStates[timerState];
        var seconds = settings[timeState][1]*60;
        var hms = secondsToHms(seconds);

        storeTime({'hms': ['counter', hms]});
        storeValue({'fill': [timerState, hms, seconds, seconds]});
        chrome.runtime.sendMessage({command: "updateTimer", "time": hms, "elapsedTime": seconds, "initialTime": seconds, "timerState": timerState});
        chrome.browserAction. setBadgeText({text: hms});
        chrome.browserAction.setBadgeBackgroundColor({color: badgeColors[timerState]});
      break;
      default:
        clearInterval(timer);
        notifyUser(timerState, soundState);
        handleTimerState(timerState, true)
        handleTimer(currentState);
    }
  }

  function zeroCheck(){
    if (currentTime === '0:00'){
      return true
    }
    return false
  }

  function storeValue(object){
    var object = object;
    chrome.storage.local.set(object, function(){
      console.log('storeValue: ' + Object.entries(object));
    });
  }

  function storeTime(object){
    var object = object;
    chrome.storage.local.set(object, function(){
      console.log('storeTime: ' + Object.entries(object));
    });
  }

  function setSound(){
    chrome.storage.local.get('volume', function(result){
      console.log('setSound:' + result.volume);
      soundState = result.volume[0]
    });
  }

  function setRepeat(){
    chrome.storage.local.get('repeat', function(result){
      console.log('setRepeat:' + result.repeat);
      repeatState = result.repeat[0]
    });
  }

  function secondsToHms(seconds) {
    seconds = Number(seconds);
    var h = Math.floor(seconds / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 3600 % 60);
    return (
      (h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s
    );
  }

  function hmstoSeconds(hms){
    var hms = hms;
    split = hms.split(":");
    if (split.length > 2){
      return split[0]*3600+split[1]*60+split[2]*1;
    }
    return split[0]*60+split[1]*1;
  }

  function getTime(){
    chrome.storage.local.get('hms', function(result){
      console.log('getTime: ' + result.hms);
      hms = result.hms
    });
  }

  function getSettings(){
    var defaultSettings = Object.keys(defaults);
    chrome.storage.local.get(defaultSettings, function(result){
      settings = result;
      if (Object.keys(result).length === 0 && result.constructor == Object){
        storeValue(defaults);
        settings = defaults;
      };
    });
  }

  function handleTimerState(timerState, set=false){
    if (set) {
      timerState = 1 - timerState;
      chrome.storage.local.set({'timerState': timerState, 'submitState': currentState})
    }
    else {
      chrome.storage.local.set({'timerState': timerState, 'submitState': currentState})
    }
  }

  function notifyUser(state, soundState){
    if (state){
      var opts = {
        "type": "basic",
        "title": "Break Time!",
        "message": breakMessage[Math.floor(Math.random()*breakMessage.length)],
        "iconUrl": "./ico/notification_1.png"
      };
    }
    else {
      var opts = {
        "type": "basic",
        "title": "Focus Time!",
        "message": focusMessage[Math.floor(Math.random()*focusMessage.length)],
        "iconUrl": "./ico/notification_2.png"
      };
    }
    var idBase = "Notification";
    var id = idBase + (new Date()).getTime();
    chrome.notifications.create(id, opts, function(){
      console.log(idBase + " created");
    })
    if (soundState){
      var audio = new Audio('./audio/notification.mp3');
      audio.play();
    }
  }
})
