vegfests
========

Starting to map vegetarian festivals. Open [where.geojson](https://github.com/drewrwilson/vegfests/blob/master/where.geojson) to view it.

two parts to this:
* get data from google docs
* make a website with the geojson data
* website features: map, upcoming list, 2014 list. find nearby based on geo, sign up to get updates


## how does this work?
This is a nodejs application that downloads a CSV of a google doc of VegFest from across the country. It produces a geojson file that is then uploaded and hosted as a static file on a CDN. A frontend can then load the geojson file and build a frontend on top of it.


## s3 environment variables
ACCESS_KEY=

SECRET_KEY=

BUCKET=

REMOTE_DIRECTORY=
