/*
*   Copyright 2015 Xiatron LLC
*/

// Set some vars
var ports = require('ports');
var appName = require('../../package.json').name;
var port = ports.getPort(appName+'-hoodie-plugin-lucene');
var fs = require('fs');
var lucenePath = '/srv/couchdb-lucene';
var status = 'Lucene Plugin is running'; //default status

// Run in the hoodie context
module.exports = function (hoodie, cb) {
    // SET THE PROXY HANDLER
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
    fs.exists(lucenePath, function(exists) {
        if (exists) {
            // Copy the files to the app
        } else {
            // Notify
            status = 'Lucene is missing.  Please install to '+lucenePath+' and restart the app.';
        }
    });

    // Output something useful
    console.log(status);
    
    // Hoodie Callback
    cb();
}