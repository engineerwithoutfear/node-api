# Sketch-fetching API

## Summary

A RESTful API that serves up-to-date source code and metadata from our organization's GitHub repo. Useful for displaying the source code alongside a sketch. 

# GETTING AND SAVING THE DATA FOR OUR API

## GITHUB API RATE LIMITS

Aka the reason this whole thing was made in the first place.

The GitHub Search API provides up to 1,000 results for each search. Authenticated requests can make up to 30 requests per minute. Unauthenticated requests can make up to 10 requests per minute.


## CREATING AN AUTHENTICATION TOKEN

'Personal access tokens function like ordinary OAuth access tokens. They can be used instead of a password for Git over HTTPS, or can be used to authenticate to the API over Basic Authentication.'

In order to make an authenticated GitHub API request, create an personal access token on GitHub and assign it to the environment variable. DON'T COMMIT THIS TO GIT since it's basically an API key. 

To create the token you can visit this URL: 

https://github.com/settings/tokens/new 

Or while logged in, go to your settings, look for 'Developer settings' in the side bar, and click on 'Personal access tokens'.

Don't check any boxes, it's not needed. Just enter a random description, create the token, and save the generated code. You can never re-access it once you create it so be sure to save it somewhere--making a new one isn't too hard though.

Current placeholder is: 

'const AUTH_TOKEN = '23682078a5fab685dba7991501bb251297185a45';'

In production this should be set to an "environment variable."

## USING THE GITHUB API

The getGitHubData() function queries the GitHub search API, looking for:

* all files written in 'javascript'
* named 'sketch.js' 
* in the folder '/examples/'
* in the repo 'science-library'
* belonging to user 'ccny-science-sims'

It then returns the path URLs for all files matching the above criteria. 

The next part of the program visits each URL, retrieves the data for each sketch.js from the GitHub API, and saves it as JSON in a .json file.

The JSON schema is: 
 {
 'id' : name of subfolder the sketch is from,
 'sketchJSCode': source code of the sketch.js,
  'sketchURL': url of the sketch,
  'repoURL': url of the repo,
  'version': the sha of the  file (coordinates to commits)
 }
 
More could easily be added - see 'sample-search-response.json' for some of the stuff returned from the github API. You can also view a sample JSON file for the sketch API at 'sample-sketch-JSON.json.'

The destination directory is set by 'destinationDirectory'. If you decide to change the directory path, the new folder will be generated automatically if it does not already exist (thank u 'fs-path'!) instead of crashing. 

The JSON file is given a filename corresponding to its id. Eg,  'bouncing-ball-vector' is saved as 'bouncing-ball-vector.json.' There's a 'nice-name' setting in the .yaml headers of the jeykll page that I think would be useful to format the API request on the front end.

# UPDATING THE DATABASE

This is done by scheduling a cron job in timer() to run every X minutes. The format goes: 'seconds minutes hours days months years.' An asterisk means every, a 0 means never, and */(num) means run every num units. '0 */5 * * * *' for example means run every 5 minutes. 

# EMBED SOURCE CODE API

The API routing is done via Express.router().

It responds to a GET request by serving the JSON with a filename/ID matching the request ID or complaining if it's not a real sketch.

Example:

'www.ourAPIsite.com/api/fetch-sketch/bouncing-ball-vector'

Under the hood, it checks if './database/${our api request}.json' exists by trying to open the file. It then returns the sketch to the browser if it's  found.

# Front End Syntax Highlighting

Currently I'm using Prism.js. 

Prism runs on page load, but since we're ajaxing the API response into the page, prism won't see it unless specifically called on it. So if it's not working, that may be why.


# TROUBLESHOOTING

* MAKE SURE TO USE A RECENT NODE VERSION. ATM this means version 7.9.0. Cloud9 starts with a old 4.0 version 

*  set 'const logHeaders = false' to 'const logHeaders = true'  for getGithubData() to see response details from GitHub API (eg, check if authentication is working and etc)

* node can do most es6, but module exports are a bit dicey at the moment, so stick with common js for import/export  

## RELEVANT FOLDERS AND FILES

* /documentation/ (sample jsons and this readme file)
* /database/nameofsketch.jsons (our lil sketches, in json format)
* /app.js (the app to be run at startup)


# RECOMMENDED READING

Some resources for anyone maintaining this:

* https://www.sitepoint.com/jsonp-examples/
* http://stackoverflow.com/questions/18310394/no-access-control-allow-origin-node-apache-port-issue
* https://www.gregjs.com/javascript/2016/checking-whether-a-file-directory-exists-without-using-fs-exists/
* http://dmh2000.github.io/spaces-tabs/spaces-tabs.html
* https://developer.github.com/v3/media/#repository-contents
* http://smilyanp.com/16-july-2015-building-a-react-js-app-part-8-everydays/ <--chaining axios promises together so they don't closure-fail
* 'Postman' Chrome App
* https://scotch.io/tutorials/learn-to-use-the-new-router-in-expressjs-4
* https://developer.github.com/v3/media/#repository-contents
* Alternate github api searches: 
var URL = 'https://api.github.com/repos/ccny-physics-sims/science-library/contents/examples/' -> redirects
* PM2 is a production process manager for node.js/io.js applications with a built-in load balancer. It allows you to keep applications pretty much alive forever, to reload them without downtime and to facilitate common system admin tasks. For the purpose of this post, we'll simply be using PM2 to "watch" the basic node app for changes, restart the app if any are made and auto boot the node.js server on device power on.



