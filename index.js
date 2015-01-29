/*
*   Copyright 2015 Xiatron LLC
*/

// Set some vars
var ports = require('ports');
var appName = require('../../package.json').name;
var port = ports.getPort(appName+'-hoodie-plugin-lucene');
var couchConfig = require('../../data/config.json').couchdb;
var fs = require('fs');
var serverBinPath = require('path').dirname(require.main.filename);
var appPath = serverBinPath.replace('node_modules/hoodie-server/bin','');
var ini = require('ini');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var lucenePath = '/opt/couchdb-lucene';
var luceneProcess;
var configItems = [
    ['couchdb/os_process_timeout/','60000'],
    ['external/fti/','/usr/bin/python "/home/hoodiehost/apps/test-011715a/data/couchdb-lucene/tools/couchdb-external-hook.py --remote-port '+port+'"'],
    ['httpd_db_handlers/_fti/','{couch_httpd_external, handle_external_req, <<"fti">>}']
];



// Run in the hoodie context
module.exports = function (hoodie, cb) {
    /*
    *   SET THE COUCHDB CONFIG
    */
    _setConfig(0);
    function _setConfig(i) {
        hoodie.request('PUT', '_config/'+configItems[i][0], {data:JSON.stringify(configItems[i][1])},function(err, data){
            if (err) console.log(err);
            if (configItems.length-1 > i) _setConfig(i+1);
        });
    }
    
    /*
    *   SETUP THE LUCENE INSTANCE
    *   Assumes Lucene has already been
    *   installed to /srv/couchdb-lucene
    *   and that the files are accessible
    */
    fs.exists(appPath+'data/couchdb-lucene', function(exists) {
        if (exists) {
            // Configure and start the instance
            _runLucene(port);
        } else {
            // Copy the files to the plugin directory
            fs.exists(lucenePath, function(exists) {
                if (exists) {
                    // Copy the files to the plugin directory
                    exec('cp -R '+lucenePath+' '+appPath+'data/couchdb-lucene', function (error, stdout, stderr) {
                        // Configure and start the instance
                        _runLucene(port);
                    });
                } else {
                    // Notify
                    console.log('Lucene is missing.  Please install to '+lucenePath+' and restart the app.');
                }
            });
        }
    });
    
    /*
    *   RUN THE LUCENE INSTANCE
    */
    function _runLucene(port) {
        // Get the couch port, apply the config, and start the service
        hoodie.request('get', '_config', {}, function(err, data){
            var couchPort = data.httpd.port;
            var config = ini.parse(fs.readFileSync(appPath+'data/couchdb-lucene/conf/couchdb-lucene.ini', 'utf-8'));
            config.lucene.port = port;
            config.local.url = 'http://'+couchConfig.username+':'+encodeURIComponent(couchConfig.password)+'@localhost:'+couchPort+'/';
            fs.writeFileSync(appPath+'data/couchdb-lucene/conf/couchdb-lucene.ini', ini.stringify(config));
            
            luceneProcess = spawn(appPath+'data/couchdb-lucene/bin/run');
            
            //listen for exit
            luceneProcess.on('close', function (code) {
               console.log('Lucene process exited with exit code '+code);
            });
        });
    }

    // Hoodie Callback
    cb();
}