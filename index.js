/*
*   Copyright 2015 Xiatron LLC
*/

// Set some vars
var ports = require('ports');
var appName = require('../../package.json').name;
var port = ports.getPort(appName+'-hoodie-plugin-lucene');
var fs = require('fs');
var exec = require('child_process').exec;
var lucenePath = '/srv/couchdb-lucene';
var status = 'Lucene Plugin is running'; //default status

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
    fs.exists('./lucene', function(exists) {
        if (exists) {
            // Configure and start the instance
            _runLucene(port);
        } else {
            // Copy the files to the plugin directory
            fs.exists(lucenePath, function(exists) {
                if (exists) {
                    // Copy the files to the plugin directory
                    exec('cp -R '+lucenePath+' lucene', function (error, stdout, stderr) {
                        // Configure and start the instance
                        _runLucene(port);
                    });
                } else {
                    // Notify
                    status = 'Lucene is missing.  Please install to '+lucenePath+' and restart the app.';
                }
            });
        }
    });
    
    /*
    *   RUN THE LUCENE INSTANCE
    */
    function _runLucene(port) {
        // Apply the latest config
        
        // Start the service
        status = 'Lucene plugin is running.'
    }

    // Output something useful
    console.log(status);
    
    // Hoodie Callback
    cb();
}