var cp = require('child_process');

module.exports = function(){
  return {
    run: function(cmdObjIn, ws, timeout){
      var self = this;
      var cmdObj = JSON.parse(cmdObjIn);
      var spawn = cp.spawn;
      var error = false;
      
      try {
        process.chdir(cmdObj.path);     
      }catch(err){
        console.log("Error setting command working directory...");
        console.log(err);
        error = true;
        ws.send("Error setting command working directory...");
      }

      if(!error){
        try{
          var cmdArray = cmdObj.command.split(' ')
          var cmd = cmdArray.splice(0, 1)[0];
          var command = spawn(cmd, cmdArray);

          if(timeout && typeof timeout === 'number'){
            self.timeoutId = setTimeout(function(){
              command.kill('SIGSTOP');
              ws.send("Command timeout reached...");
            }, timeout * 1000);
          }

          command.stdout.on('data', function (data) {
            data = String(data).replace(/(?:\n\r?|\r\n?)/g, '<br>').replace(/(\s)|(\[K)/g, '&nbsp;');
            ws.send(data);
          });

          command.stderr.on('data', function (data) {
            data = "<span class=\"error\">" + String(data).replace(/(?:\n\r?|\r\n?)/, '<br>') + "</span>";
            ws.send(data);
          });

          command.on('exit', function (code) {
            clearTimeout(self.timeoutId);
            //console.log('child process exited with code ' + code);
            ws.send('child process exited with code ' + code + '<br><br>');
          });
        }catch(err){
          console.log("Error running command and returning output");
          console.log(err);
          error = true;
          ws.send("Error running command and returning output...");
        }
      }
    }
  }
}



  
