/*
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

var Connection = require('ssh2');
var fs = require('fs');


/**
 * ssh remote execute command
 */
module.exports = function() {

  var exec = function(mode, host, user, keyPath, command, cb) {
    var op = {cmd: command,
              host: host,
              user: user,
              keyPath: keyPath};

    if ('preview' === mode) {
      cb(null, op);
    }
    else {
      var c = new Connection();
      var response = '';
      c.on('ready', function() {
        c.exec(command, function(err, stream) {
          if (err) { return cb(err, op); }
          stream.on('data', function(data) {
            response += data.toString();
          });
          stream.on('end', function() {
          });
          stream.on('close', function() {
          });
          stream.on('exit', function() {
            c.end();
          });
          stream.stderr.on('data', function(data) {
            response += data.toString();
          });
        });
      });
      c.on('error', function(err) {
        cb(err, op);
        c.removeAllListeners('close');
      });
      c.on('end', function() {
        //cb(null, response);
      });
      c.on('close', function() {
        cb(null, op, response);
      });

      fs.readFile(keyPath, function(err, data) {
        if (err) {
          return cb(err);
        }

        c.connect({host: host,
                   port: 22,
                   username: user,
                   privateKey: data});
      });
    }
  };



  return {
    exec: exec
  };
};

