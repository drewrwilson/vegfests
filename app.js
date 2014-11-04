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
    csv2geojson = require('csv2geojson');



var config = {
            "outputDirectory" : 'data/',
            "csvLink" : "https://docs.google.com/spreadsheet/ccc?key=1Wna5S_59sy1ycidSsFERKefd_Wy7oajyCknifkpzdcU&output=csv",
            "filename" : "vegfests"
          }


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


initialize (config.outputDirectory, function () {
    console.log('Using this directory for data output: ' + config.outputDirectory);
});

request(config.csvLink, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body) // Print the CSV

    var geoJson = csv2geojson.csv2geojson(body, {
      latfield: '2014 Latitude',
      lonfield: '2014 Longitude',
      delimiter: ','
    },
    function(err, data) {
        // err has any parsing errors
        // data is the data.
        jsonString = JSON.stringify(data);
        writeToFile(jsonString, config.outputDirectory + Date.now() + '-' + config.filename + '.geojson', function () {
            console.log('Successfully wrote data to geojson: ' + config.filename + '.geojson');
          })

    });


    writeToFile(body, config.outputDirectory + Date.now() + '-' + config.filename + '.csv', function () {
    console.log('Successfully wrote data to CSV: ' + config.filename);
  })
  }
})
