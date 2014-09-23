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

var executor = require('./executor');


var wrap = function(o) {
  var so = '';
  var se = '';

  var stdout = function(str) {
    so += str;
    o.stdout(str);
  };
  var stderr = function(str) {
    se += str;
    o.stderr(str);
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



module.exports = function() {

  var check = function(host, user, keyPath, out, cb) {
    var cmd;
    var w = wrap(out);

    if (keyPath) {
      cmd = 'ssh -i ' + keyPath + ' -o batchMode=yes -o StrictHostKeyChecking=no -T ' + user + '@' + host + ' true';
    }
    else {
      cmd = 'ssh -o batchMode=yes -o StrictHostKeyChecking=no -T ' + user + '@' + host + ' true';
    }
    var op = {cmd: cmd,
              host: host,
              user: user,
              keyPath: keyPath,
              loc: __dirname};
    executor.exec('live', op.cmd, op.loc, w, function() {
      if (w.output().indexOf('Permission denied') !== -1) {
        cb('permission denied - possible ssh key or key password problem');
      }
      else {
        cb(null, op);
      }
    });
  };


  return {
    check: check
  };
};

