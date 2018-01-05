window.addEventListener('load', function(){

  var url_list = []
  getStates();

  $("#blocked-sites").on("keyup", function(e) {
    if (e.keyCode == 13 || e.which == 13){
      var urls = ($("#blocked-sites").val()).split(/\r?\n/)
      storeSites()
    }
    if (e.keyCode == 8 || e.keyCode == 46){
      var urls = ($("#blocked-sites").val()).split(/\r?\n/)
      storeSites();
    }
  })
  $("#blocked-sites").bind('paste', function() {
    setTimeout(function(){
      var urls = ($("#blocked-sites").val()).split(/\r?\n/)
      storeSites();
    }, 100)
  })
  $("#blocked-sites").bind('keyup', 'ctrl+z', function() {
    setTimeout(function(){
      var urls = ($("#blocked-sites").val()).split(/\r?\n/)
      storeSites();
    }, 100)
  });
  $("#save-btn").on('click',function(){
    var urls = ($("#blocked-sites").val()).split(/\r?\n/)
    storeSites()
  })
  $("#block-btn").on('click', function(){
    if (document.getElementById('block-btn').innerHTML == 'Off'){
      document.getElementById('block-btn').innerHTML = 'On';
      document.getElementById('block-btn').className = 'btn btn-primary btn-wide';
      storeButtonState(true);
    }
    else {
      document.getElementById('block-btn').innerHTML = 'Off';
      document.getElementById('block-btn').className = 'btn btn-default btn-wide';
      storeButtonState(false);
    }
  })

  function storeSites(){
    url_list = []
    var urls = ($("#blocked-sites").val()).split(/\r?\n/)
    storeTextarea(urls)
    if (document.getElementById("blocked-sites").value == ""){
      url_list = []
    }
    else {
      for (var i = 0; i < urls.length; i++){
        if (url_list.includes(urls[i]) || urls[i] == ""){
          continue
        }
        url_list.push(urls[i])
      }
    }
    for (var url in url_list){
      // Valid URLs defined by https://developer.chrome.com/extensions/match_patterns
      validateUrl(url_list[url])
    }
    url_list = cleanArray(url_list)
    console.log('URL List %O', url_list);
    clearDatabase()
    storeUrls()
  }

  function storeTextarea(urls){
    console.log('storeSites: ' + urls);
    chrome.storage.local.set({'textarea': urls});
  }

  function clearDatabase() {
    chrome.runtime.sendMessage({command: "storeUrls", value: []});
  }

  function storeUrls(){
    chrome.runtime.sendMessage({command: "storeUrls", value: url_list});
  }

  function storeButtonState(state){
    chrome.storage.local.set({'blockButton': state}, function(){
      console.log('storeButtonState: ' + state);
      storeSites()
    })
  }

  function validateUrl(url){
    console.log('Validate URL: ' + url);

    //var pattern = new RegExp("http[s]*:\/\/[a-z|0-9]*.[a-z|0-9]*.[a-z]*\//gi");
    //var scheme = new RegExp("http[s]*:/gi");
    //var host = new RegExp("[a-z|0-9]*./gi");
    //var path = new RegExp("[a-z|0-9]*.[a-z]*/gi");
    var pattern = /http[s]*:\/\/[a-z|0-9]*.[a-z|0-9]*.[a-z]*\//gi
    var scheme = /http[s]*:/gi
    var host = /[a-z|0-9]*\./i
    var path = /\.[a-z|0-9]*\.[a-z]*/gi
    var host_path = /[a-z|0-9]*\.[a-z|0-9]*\.[a-z]*/gi
    var no_host = /[a-z|0-9]*\.[a-z]*/gi
    var rest = /\/[a-z|0-9]*/gi

    var scheme_state = false
    var host_state = false
    var path_state = false
    // if (pattern.test(url)){
    //   console.log('Full Match');
    //   return
    // }

    var index = url_list.indexOf(url)
    var url_split = url.split('/')
    for (var i = 0; i < url_split.length; i++){
      var string = url_split[i]
      var string_index = url_split.indexOf(string)
      console.log('Check URL patterns of ' + string);

      if (scheme.test(string)){
        url_split[string_index] = '*://'
        scheme_state = true
        console.log('Fix Scheme ' + url_split[string_index]);
        continue
      }

      else if (host_path.test(string)){
        host_state = true
        if (scheme_state){
          var new_host = string.replace(host, '*.')
          url_split[string_index] = new_host
          if (path.test(new_host)){
            path_state = true
            url_split[string_index] = new_host + '/*'
            console.log('Fix Path ' + url_split[string_index]);
          }
          else {
            url_split[string_index] = '*://*.' + new_host + '/*'
            console.log('Fix Path and Set Host ' + url_split[string_index]);
          }
        }
        else {
          var new_host = string.replace(host, '*://*.')
          url_split[string_index] = new_host
          console.log('Fix Scheme ' + url_split[string_index]);
          if (path.test(new_host)){
            path_state = true
            url_split[string_index] = new_host + '/*'
            console.log('Fix Path ' + url_split[string_index]);
          }
          else {
            url_split[string_index] = '*://*.' + new_host + '/*'
            console.log('Fix Path and Set Host ' + url_split[string_index]);
            updateUrlList()
          }
        }
        continue
      }

      else if (no_host.test(string)){
        path_state = true
        if (host_state){
          url_split[string_index] = string + '/*'
          console.log('Fix Path');
        }
        else {
          if (scheme_state){
            url_split[string_index] = '*.' + string + '/*'
          }
          else {
            url_split[string_index] = '*://*.' + string + '/*'
          }
          console.log('Fix Path and Set Host ' + url_split[string_index]);
          updateUrlList()
        }
        continue
      }

      else if (rest.test(string)){
        console.log('Fix Rest');
        continue
      }

      else if (string == ''){
        console.log('Empty String');
        continue
      }

      else {
        url_split[string_index] = ''
        console.log('Invalid Pattern');
        continue
      }
    }
    var new_url = url_split.join('')
    url_list[index] = new_url
    return

    function updateUrlList() {
      var new_url = url_split[string_index]
      url_list[index] = new_url
      return
    }

  }

  function cleanArray(actual) {
    var newArray = new Array();
    for (var i = 0; i < actual.length; i++) {
      if (actual[i]) {
        newArray.push(actual[i]);
      }
    }
    return newArray;
  }

  function getStates(){
    chrome.runtime.sendMessage({command: 'getStates'}, function(response){
      if (Object.keys(response).length === 0 && response.constructor == Object){
        getStates()
      };
      var states = response.states;
      var checked = states['blockButton'];
      if (checked){
        document.getElementById('block-btn').className = 'btn btn-primary btn-wide';
        document.getElementById('block-btn').innerHTML = 'On'
      }
      else{
        document.getElementById('block-btn').className = 'btn btn-default btn-wide';
        document.getElementById('block-btn').innerHTML = 'Off'
      }
      var urls = states['textarea'].join().replace(/,/gi, "\n").replace(/^,/,"");;
      document.getElementById('blocked-sites').value = urls;
    })
  }
})
