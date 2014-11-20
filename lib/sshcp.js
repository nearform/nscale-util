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



/**
 * deploy commands for demo
 */
module.exports = function(logger) {
  var executor = require('./executor')(logger);
  logger = logger || bunyan.createLogger({name: 'nscale-util'});

  var copy = function(mode, host, user, keyPath, sourcePath, targetPath, out, cb) {
    var op = {cmd: 'scp -i ' + keyPath + ' ' + sourcePath + ' ' + user + '@' + host + ':' + targetPath,
              host: host,
              user: user,
              keyPath: keyPath};

    logger.info('sshcp: ' + op.cmd);
    if ('preview' === mode) {
      cb(null, op);
    }
    else {
      executor.exec(mode, op.cmd, null, out, function(err) {
        cb(err, op);
      });
    }
  };



  return {
    copy: copy
  };
};

