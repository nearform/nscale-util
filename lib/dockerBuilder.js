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

var os = require('os');
var fse = require('fs-extra');
var fs = require('fs');
var logger = require('bunyan').createLogger({name: 'docker-container'});
var executor = require('./executor');
var paths = require('./paths');
var docker = require('./docker');



/**
 * docker specific build process
 */
module.exports = function(config, platform) {


  /**
   * check that docker is able to run on this system
   */
  var preCheck = function() {
    var stat = fs.existsSync('/var/run/docker.sock');
    if (!stat) {
      stat = process.env.DOCKER_HOST || false;
    }
    return stat;
  };



  var scriptsPath = function() {
    if (platform) {
      return '/../scripts/' + platform;
    }
    else {
      return '/../scripts/' + os.platform();
    }
  };



  var readVersion = function(path) {
    var version = 'unspecified';
    var pkg;

    try {
      pkg = fs.readFileSync(path + '/package.json');
      version = JSON.parse(pkg).version;
    }
    catch (e) {
      // ignore parse errors 
    }
    return version;
  };



  var createImage = function(mode, system, containerDef, targetPath, out, cb) {
    var targetName = containerDef.name.replace(' ', '_');
    var path = paths.generateTargetPath(system, config, containerDef);
    var buildPath = paths.generateBuildPath(system, config);

    out.stdout('creating docker image');
    logger.info('creating docker image');

    fse.mkdirp(buildPath);
    path = path + '/';
    var script = fs.readFileSync(__dirname + scriptsPath() + '/containerBuildTemplate.sh', 'utf8');
    script = script.replace(/__NAMESPACE__/g, system.namespace);
    script = script.replace(/__TARGETNAME__/g, targetName);
    script = script.replace(/__BUILDNUMBER__/g, containerDef.specific.buildHead);
    fs.writeFileSync(path + targetPath + '/container.sh', script, 'utf8');
    logger.debug('docker build script:');
    logger.debug(script);

    executor.exec(mode, 'sh container.sh ' + system.namespace + ' ' + containerDef.specific.targetName, path + targetPath, out, function() {
      out.progress('running export');
      fse.remove(path + '/container.sh', function() {
        var script = fs.readFileSync(__dirname + scriptsPath() + '/containerExportTemplate.sh', 'utf8');
        script = script.replace(/__NAMESPACE__/g, system.namespace);
        script = script.replace(/__TARGETNAME__/g, targetName);
        script = script.replace(/__BUILDNUMBER__/g, containerDef.specific.buildHead);
        script = script.replace(/__BUILDPATH__/g, buildPath);
        fs.writeFileSync(path + targetPath +  '/export.sh', script, 'utf8');
        logger.debug('docker export script:');
        logger.debug(script);
        executor.exec(mode, 'sh export.sh ' + system.namespace + ' ' + containerDef.specific.targetName, path + targetPath, out, function() {
          out.progress('creating image');
          fse.remove(path + '/container.sh', function() {
            docker.findImage(system.namespace + '/' + targetName + '-' + containerDef.specific.buildHead, function(err, image) {
              cb(err, {dockerImageId: image.Id,
                       containerBinary: buildPath + '/' + targetName + '-' + containerDef.specific.buildHead,
                       dockerLocalTag: system.namespace + '/' + targetName + '-' + containerDef.specific.buildHead,
                       buildNumber: containerDef.specific.buildHead});
            });
          });
        });
      });
    });
  };



  var build = function(mode, system, containerDef, out, cb) {
    var path = paths.generateTargetPath(system, config, containerDef);
    var version = readVersion(path);
      
    if (preCheck()) {
      if (containerDef.specific.buildScript) {
        out.stdout('running build script: sh ./' + containerDef.specific.buildScript);
        logger.info('running build script: sh ./' + containerDef.specific.buildScript);
        out.progress('running build script: ' + containerDef.specific.buildScript);
        executor.exec(mode, 'sh ./' + containerDef.specific.buildScript, path, out, function(err, targetPath) {
          out.progress('creating image');
          createImage(mode, system, containerDef, targetPath, out, function(err, specific) {
            specific.version = version;
            containerDef.version = version;
            cb(err, specific);
          });
        });
      }
      else {
        out.progress('no build script present, skipping');
        out.progress('creating image');
        createImage(mode, system, containerDef, '.', out, function(err, specific) {
          specific.version = version;
          containerDef.version = version;
          cb(err, specific);
        });
      }
    }
    else {
      cb('docker precheck failed, please enusure that docker can run on this system', null);
    }
  };



  return {
    build: build,
  };
};


