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

var bunyan = require('bunyan');


var accumulator = function() {
  var so = '';
  var se = '';

  var stdout = function(str) {
    so += str;
  };
  var stderr = function(str) {
    se += str;
  };
  var output = function() {
    return so + se;
  };
  return {
    stdout: stdout,
    stderr: stderr,
    output: output
  };
};



module.exports = function(logger) {
  var executor = require('./executor')(logger);
  logger = logger || bunyan.createLogger({name: 'nscale-util'});

  var check = function(host, user, keyPath, out, cb) {
    var completed = false;
    var calledback = false;
    var cmd;
    var w = accumulator();

    if (keyPath) {
      cmd = 'ssh -i ' + keyPath + ' -o batchMode=yes -o StrictHostKeyChecking=no -T ' + user + '@' + host + ' true';
    }
    else {
      cmd = 'ssh -o batchMode=yes -o StrictHostKeyChecking=no -T ' + user + '@' + host + ' true';
    }
    logger.info('sshcheck: ' + cmd);
    var op = {cmd: cmd,
              host: host,
              user: user,
              keyPath: keyPath,
              loc: __dirname};

    // in some cases the ssh check will connect BUT there will be no close event on the socket, this can occurr
    // when the OS is configured to hold open ssh connections. Trap this condition here...
    setTimeout(function() {
      if (!completed) {
        calledback = true;
        cb(null, op);
      }
    }, 6000);

    executor.exec('live', op.cmd, op.loc, w, function() {
      completed = true;
      if (!calledback) {
        if (w.output().indexOf('Permission denied') !== -1 || w.output().indexOf('Authentication failure') !== -1) {
          logger.error('sshcheck ERROR: ' + w.output);
          cb(new Error('permission denied - possible ssh key or key password problem'));
        }
        else {
          cb(null, op);
        }
      }
    });
  };


  return {
    check: check
  };
};

