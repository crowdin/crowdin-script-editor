var code, request, response;

$(function() {
  $("#samples").change(function() {
    loadSample(this.value);
  });

  code = CodeMirror.fromTextArea(document.getElementById("code"), {
    lineNumbers: true,
    matchBrackets: true,
    mode: "text/typescript"
  });

  code.on("change",function(cm,change) {
    localStorage.setItem('code', code.getValue());
  });


  request = CodeMirror.fromTextArea(document.getElementById("request"), {
    lineNumbers: false,
    matchBrackets: true,
    mode: "text/typescript"
  });

  request.on("change",function(cm,change) {
    localStorage.setItem('request', request.getValue());
  });

  response = CodeMirror.fromTextArea(document.getElementById("response"), {
    lineNumbers: false,
    matchBrackets: true,
    readOnly: true,
    mode: "text/typescript"
  });

  document.onkeyup = function(e) {
    if (e.ctrlKey && e.which == 89) {
      runButton();
    }

    if (e.ctrlKey && e.which == 73) {
      resetEditor();
    }
  };

  if(localStorage.getItem('code') && localStorage.getItem('code').length) {
    code.setValue(localStorage.getItem('code'));
  } else {
    loadSample("check-simple");
  }

  if(localStorage.getItem('request') && localStorage.getItem('request').length) {
    request.setValue(localStorage.getItem('request'));
  }
});

var jsInterpreter;
var console_log_warning = false;

function initAlert(interpreter, scope) {
  var myConsole = interpreter.createObject(interpreter.OBJECT);
  interpreter.setProperty(scope, 'console', myConsole);

  var wrapper = function(text) {
    text = text ? text.toString() : '';

    if(!console_log_warning) {
      console_log_warning = true;
      console.log('%cconsole.log(); is not available in production. Please make sure the debug code is removed before deploying on Crowdin.', 'color: red;');
    }
    // response.replaceRange(text + "\r\n", CodeMirror.Pos(response.lastLine()));

    return interpreter.createPrimitive(console.log(text));
  };

  this.setProperty(myConsole, 'log', this.createNativeFunction(wrapper));

  var wrapper = function() {
    return request.getValue();
  };
  interpreter.setProperty(scope, 'getRequest', interpreter.createNativeFunction(wrapper));

  var wrapper = function(text) {
    response.replaceRange(JSON.stringify(JSON.parse(text), null, 2) + "\r\n", CodeMirror.Pos(response.lastLine()));
  };
  interpreter.setProperty(scope, 'sendReply', interpreter.createNativeFunction(wrapper));
}

function runButton() {
  resetEditor();

  var src = code.getValue();
  
  var start = new Date().getTime();

  if(!src.length) {
    resetEditor();
    return;
  }

  try {
    jsInterpreter = new Interpreter(src, initAlert);

    var result = jsInterpreter.run();
  } catch(e) {
    // response.setValue(e.stack);
    response.replaceRange(e.stack, CodeMirror.Pos(response.lastLine()));
  }

  var end = new Date().getTime();

  var time = (end - start);

  setResponseStatus();
  setRequestStatus();

  $("#time").text("Execution time: " + time + " ms.");
}

function resetEditor() {
  response.setValue("");
  $("#time").text("");
  $("#response-status").html("");
  $("#request-status").html("");
}

function setResponseStatus() {
  if(true) {
    $("#response-status").html("⚠️ The response should contain Validations node");
  } else {
    $("#response-status").html("⚠️");
  }
}

function setRequestStatus() {
  if(true) {
      $("#request-status").html("✔️");
  } else {
      $("#request-status").html("⚠️");
  }
}

function copyToClipboard() {
  navigator.clipboard.writeText(code.getValue());
}

function loadSample(id) {
  if(code.getValue().length) {
    if(!confirm("This will replace your data")) {
      return;
    }
  }

  code.setValue(samples[id].code);
  request.setValue(samples[id].request);
  
  resetEditor();
}

var samples = {
  "check-simple": {
    code: `var data = JSON.parse(getRequest());

data.source_string = data.source_string.replace("l", "w");

sendReply(JSON.stringify(data));`,
    request: `{
  "source_string": "hello world.",
  "translated_string": "Це пеPеклад"
}`
  },

  "check-regex": {
    code: ``,
    request: ``
  }
}