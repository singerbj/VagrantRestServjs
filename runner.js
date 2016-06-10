var cp = require('child_process');
var untildify = require('untildify');
var fs = require('fs');

module.exports = function() {
    var currentDir = '~';
    var spawn = cp.spawn;
    var error = false;
    var command;
    var randomHex;
    return {
        // parseCommands: function(cmd) {
        //     //replace all spaces
        //     cmd = cmd.replace(/\s{2,}/, ' ');
        // },
        run: function(cmdObjIn, ws, timeout) {
            var self = this;
            var cmdObj = JSON.parse(cmdObjIn);


            console.log(currentDir);
            try {
                process.chdir(untildify(currentDir));
            } catch (err) {
                console.log("Error setting command working directory...");
                console.log(err);
                error = true;
                ws.send("Error setting command working directory...");
            }

            if (!error) {
                try {
                    // var cmdArray = cmdObj.command.split(' ');
                    // var cmd = cmdArray.splice(0, 1)[0];
                    randomHex = '#'+Math.floor(Math.random()*16777215).toString(16);
                    command = cmdObj.command.trim();
                    if(command.length > 0){
                        if(command[command.length -1] === ';'){
                            command = command.substring(0, command.length - 1);
                        }
                        command = command + '; echo "' + randomHex + '`pwd`"';
                        fs.writeFile(untildify("~/.tmpScript.sh"), command, function(err) {
                            if (err) {
                                return console.log(1, err);
                            }
                            var proc = spawn(untildify("~/.tmpScript.sh"));

                            if (timeout && typeof timeout === 'number') {
                                self.timeoutId = setTimeout(function() {
                                    command.kill('SIGSTOP');
                                    ws.send("Command timeout reached...");
                                }, timeout * 1000);
                            }

                            proc.stdout.on('data', function(data) {
                                data = String(data);
                                var array = data.split(randomHex);
                                // console.dir(array);
                                // console.log(array.length);
                                data = array[0];
                                if(array.length > 1){
                                    var pwd = array[array.length -1];
                                    currentDir = untildify(pwd.trim());
                                }
                                data = '<br>' + data.replace(/(?:\n\r?|\r\n?)/g, '<br>').replace(/(\s)|(\[K)/g, '&nbsp;');
                                ws.send(data);
                            });

                            proc.stderr.on('data', function(data) {
                                data = "<span class=\"error\">" + String(data).replace(/(?:\n\r?|\r\n?)/, '<br>') + "</span><br>";
                                ws.send(data);
                            });

                            proc.on('exit', function(code) {
                                clearTimeout(self.timeoutId);
                                //console.log('child process exited with code ' + code);
                                // ws.send('child process exited with code ' + code + '<br><br>');
                            });
                        });
                    }else{
                        ws.send('');
                    }
                    // fs.unlink(untildify("~/.tmpScript.sh"), callback);

                } catch (err) {
                    console.log("Error running command and returning output");
                    console.log(err);
                    error = true;
                    ws.send("Error running command and returning output...");
                }
            }
        }
    };
};
