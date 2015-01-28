/*
*   Copyright 2015 Xiatron LLC
*/

// Set some vars
var ports = require('ports');
var appName = require('../../package.json').name;
var port = ports.getPort(appName+'-hoodie-plugin-lucene');
var fs = require('fs');
var ini = require('ini');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var lucenePath = '/srv/couchdb-lucene';

// Run in the hoodie context
module.exports = function (hoodie, cb) {
    /*
    *   SET THE PROXY HANDLER
    */
    var value = '{couch_httpd_proxy, handle_proxy_req, <<"http://127.0.0.1:'+port+'">>}';
    hoodie.request('PUT', '_config/httpd_global_handlers/_fti/', {data:JSON.stringify(value)},function(err, data){
        if (err) console.log(err);
    });
    
    /*
    *   SETUP THE LUCENE INSTANCE
    *   Assumes Lucene has already been
    *   installed to /srv/couchdb-lucene
    *   and that the files are accessible
    */
    fs.exists('couchdb-lucene', function(exists) {
        if (exists) {
            // Configure and start the instance
            _runLucene(port);
        } else {
            // Copy the files to the plugin directory
            fs.exists(lucenePath, function(exists) {
                if (exists) {
                    // Copy the files to the plugin directory
                    exec('cp -R '+lucenePath+' couchdb-lucene', function (error, stdout, stderr) {
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
            var config = ini.parse(fs.readFileSync('couchdb-lucene/conf/couchdb-lucene.ini', 'utf-8'));
            config.lucene.port = port;
            config.local.url = 'http://localhost:'+couchPort+'/';
            fs.writeFileSync('couchdb-lucene/conf/couchdb-lucene.ini', ini.stringify(config));
            
            var luceneProcess = spawn('couchdb-lucene/bin/run');
            
            //listen for exit
            luceneProcess.on('close', function (code) {
               console.log('Lucene process exited with exit code '+code);
            });
        });
    }

    // Hoodie Callback
    cb();
}