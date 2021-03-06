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

var fs = require('fs');
var depth = 0;


module.exports = function(dir, pattern, maxDepth, onFileCallback, onDirectoryCallback, onCompleteCallback)
{
  var files = fs.readdirSync(dir);

  for (var index = 0; index < files.length; ++index)
  {
    var current = fs.statSync(dir + '/' + files[index]);

    if (null !== onFileCallback && !current.isDirectory() && !current.isSymbolicLink())
    {
      if (pattern.test(files[index]))
      {
        onFileCallback(dir + '/' + files[index]);
      }
    }
    else if (current.isDirectory() && !current.isSymbolicLink())
    {
      if (null !== onDirectoryCallback && pattern.test(files[index]))
      {
        onDirectoryCallback(dir + '/' + files[index]);
      }
      if (depth < maxDepth) {
        ++depth;
        module.exports(dir + '/' + files[index], pattern, maxDepth, onFileCallback, onDirectoryCallback);
        --depth;
      }
    }
  }
  if (0 === depth && undefined !== onCompleteCallback)
  {
    onCompleteCallback();
  }
};

