/*
This script loads data from a google doc about VegFests across the country and produces a geojson file. For now it'll just do 2014 dates.

Here's the plan:
* load CSV from gdocs
* check if all neccesary fields are there (location, 2014 date, name, website)
* make a geojson (2014 dates)
* write out geojson to a local directory
* seperately, run sync.js periodically to sync data directory with s3

*/

/*
Download CSV link:
*/

var request = require('request'),
    fs = require('fs'),
    csv2geojson = require('csv2geojson'),
    knox = require('knox');

var config = {
            "outputDirectory" : 'data/',
            "csvLink" : "https://docs.google.com/spreadsheet/ccc?key=1Wna5S_59sy1ycidSsFERKefd_Wy7oajyCknifkpzdcU&output=csv",
            "filename" : "vegfests",
            "accessKeyID" : process.env.ACCESS_KEY,
            "secretKey" : process.env.SECRET_KEY,
            "bucket" : process.env.BUCKET,
            "remoteDirectory" : process.env.REMOTE_DIRECTORY
          }

var client = knox.createClient({
    key: config.accessKeyID
  , secret: config.secretKey
  , bucket: config.bucket
});

function ensureExists(path, mask, cb) {
    if (typeof mask == 'function') { // allow the `mask` parameter to be optional
        cb = mask;
        mask = 0777;
    }
    fs.mkdir(path, mask, function(err) {
        if (err) {
            if (err.code == 'EEXIST') cb(null); // ignore the error if the folder already exists
            else cb(err); // something else went wrong
        } else cb(null); // successfully created folder
    });
}

function initialize (directory, callback) {
  //make sure data directory exists, if not create it
  ensureExists(__dirname + '/' + directory, 0744, function(err) {
    if (err) {
      console.log(err);
    } // handle folder creation error
    else {
      callback();
    }// we're all good
  });

}

function writeToFile (data, filename, callback) {
  fs.writeFile(filename, data, function (err) {
    if (err) return console.log(err);
    callback();
  });
}

function writeToS3 (geoJSON, filename, callback) {
  var req = client.put(filename, {
      'Content-Length': geoJSON.length,
    'Content-Type': 'application/json',
    'x-amz-acl': 'public-read'
  });
  req.on('response', function(res){
    if (200 == res.statusCode) {
      console.log('saved to %s', req.url);
    }
  });
  req.end(geoJSON);

}

initialize (config.outputDirectory, function () {
    console.log('Using this directory for data output: ' + config.outputDirectory);
});

request(config.csvLink, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    // console.log(body) // Print the CSV
    console.log('Downloaded CSV of google doc successfully');

    var geoJson = csv2geojson.csv2geojson(body, {
      latfield: '2014 Latitude',
      lonfield: '2014 Longitude',
      delimiter: ','
    },
    function(err, data) {
        // err has any parsing errors
        // data is the data.
        jsonString = JSON.stringify(data);
        var timestamp = Date.now();
        writeToFile(jsonString, config.outputDirectory + timestamp + '-' + config.filename + '.geojson', function () {
            console.log('Successfully wrote data to geojson: ' + timestamp + '-' + config.filename + '.geojson');
          })
        writeToS3(jsonString, config.remoteDirectory + timestamp + '-' + config.filename + '.geojson', function () {
            // console.log('Successfully wrote data to S3.);
          });
        writeToS3(jsonString, config.remoteDirectory + config.filename + '.geojson', function () {
            // console.log('Successfully wrote data to S3.);
          });

    });

  }
})
