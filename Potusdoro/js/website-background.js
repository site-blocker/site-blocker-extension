var placeholder = ["https://thisfakeplaceholderimade.com/"];
var blockedSites;
var blockButtonState;
var states;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  switch (request.command) {
    case 'storeUrls':
      blockedSites = placeholder.concat(request.value);
      chrome.storage.local.set({'blockedSites': blockedSites}, function(){
        console.log('Set Blocked Sites: ' + Object.values(blockedSites));
        getSites()
      });
      break;
    case 'getStates':
      getStates(sendResponse)
      return true
      break;
    case 'getSites':
      getSites()
      break;
  }
})

function getSites(){
  chrome.storage.local.get('blockedSites', function(result){
    if (Object.keys(result).length === 0 && result.constructor == Object){
      blockedSites = placeholder
    }
    else {
      blockedSites = Object.values(result)[0]
    }
  })
  chrome.webRequest.onBeforeRequest.removeListener(blockRequest);
  checkStates(blockedSites)
}

function blockRequest(info) {
  console.log("Blocking " + Object.values(blockedSites));
  return {redirectUrl: chrome.extension.getURL("block.html")};
}

function checkStates(urls){
  chrome.storage.local.get(['blockButton', 'timerState'], function(result){
    blockButtonState = result['blockButton'];
    timerState = result['timerState'];
    if (blockButtonState == true && timerState == 1){
      updateFilters(urls)
    }
  })
}

function updateFilters(urls){
  if(chrome.webRequest.onBeforeRequest.hasListener(blockRequest)){
    chrome.webRequest.onBeforeRequest.removeListener(blockRequest);
  }
  chrome.webRequest.onBeforeRequest.addListener(
    blockRequest, {urls: urls}, ["blocking"])
}

function getStates(sendResponse){
  chrome.storage.local.get(['textarea', 'blockButton'], function(result){
    states = result;
    if (Object.keys(result).length === 0 && result.constructor == Object){
      states = {'blockButton': false, 'textarea': ""}
    };
    console.log('Got States ' + Object.entries(states));
    sendResponse({'states': states})
  });
}
