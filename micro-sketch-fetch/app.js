const express = require('express');
const app = express();
const fs = require("fs");
const fsPath = require('fs-path');
const PORT = process.env.PORT || 8080;
const jsonfile = require('jsonfile')
const axios = require('axios');
const Base64 = require('js-base64').Base64;
const cron = require('cron');
//settings
const AUTH_TOKEN = '23682078a5fab685dba7991501bb251297185a45'; // replace/hide this later
const destinationDirectory = './database/sketches/';
let accessPermissions = 'http://sciencesims.com/';

// Using the following parameters - 
// user:ccny-physics-sims 
// repo:science-library 
// language:JavaScript 
// path:/examples/
// on the default branch
const URL = 'https://api.github.com/search/code?q=user:ccny-physics-sims+repo:science-library+path:examples/+language:javascript+filename:sketch.js';
// send authenticaton along with GET request to GitHub API
const config = {
    headers: {
        'Authorization': 'Bearer ' + AUTH_TOKEN
    }
};

// set to true to see response details from GitHub API (eg, check if authentication is working and etc)
const logHeaders = false;

const sketchURLs = [];
////////////////////////////////////////
// ROUTES FOR OUR API
const router = express.Router(); // get an instance of the express Router

// apply the routes to our application
app.use('/', router);

// route middleware that will happen on every request
router.use(function(req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', accessPermissions ); // can use 'https://s.codepen.io' for debugging
    // log each request to the console
    // console.log(req.method, req.url);

    // continue doing what we were doing and go to the route
    next();
});

// home page route (http://localhost:8080)
router.get('/', function(req, res) {
    res.send('im an api!');
});

let data = {}
// api page route 
router.get('/api/sketch-fetch/:sketch', function(req, res) {
    let doublechecked = false;
    
    // console.log(req.params.sketch, res)
    const data = fs.readFile(__dirname + "/database/sketches/" + req.params.sketch + ".json", 'utf8', function(err, data) {
        const sketchJSON = JSON.parse(data);
        res.end(JSON.stringify(sketchJSON));
        return data
    });
       // console.log(data) // why is this still undefined!? investigate
});

function checkSavePath(directory) {
    fsPath.mkdir(directory);
}

const debugHeaders = function(response) {
    console.log(response.status);
    console.log(response.statusText);
    console.log(response.headers);
    console.log(response.config);
}

// locates all subfolders in science-library/examples/ and returns URLs all the sketch.js-es contained within them
function getGitHubURLs(URL) {
    return axios.get(URL, config).then(function(response) {
        if (logHeaders) {
            debugHeaders(response)
        }
        return findSketches(response);
    });
}

// locates all the sketch.js-es in the subfolders and returns an array of URLs to the sketches
function findSketches(response) {
    const sketchCount = response.data.total_count;
    for (let i = 0; i < sketchCount; i++) {
        // get the URLs for all the sketch.js-es...
        const sketch = response.data.items[i].url;
        sketchURLs.push(sketch);
    }
    return sketchURLs;
}

// uses array of sketch URLs to request the content/data/etc from github for each sketch.js
function getFiles(sketchURLs) {
    // check if the directory exists, if not, create it
    checkSavePath(destinationDirectory)
        // get all the sketchies
    for (let i = 0; i < sketchURLs.length; i++) {
        axios.get(sketchURLs[i], config)
            .then(function(sketchDL) {
                if (logHeaders) {
                    debugHeaders(sketchDL)
                }
                const path = sketchDL.data.path;
                const sketchFolder = path.substring(path.indexOf('/') + 1, path.lastIndexOf("/"));
                const id = sketchFolder;
                const version = sketchDL.data.sha;
                const sketchURL = sketchDL.data.html_url;
                const repoURL = sketchURL.slice(0, -sketchDL.data.name.length)
                const sketchJSCode = Base64.decode(sketchDL.data.content);
                const sketchJSON = {
                    'id': id,
                    'sketchJSCode': sketchJSCode,
                    'sketchURL': sketchURL,
                    'repoURL': repoURL,
                    'version': version
                }
                const filename = id;
                const file = destinationDirectory + filename + '.json';
                //like fs.writeFile(), but makes parent directories if required instead of crashing
                jsonfile.writeFile(file, sketchJSON)
            })
    }
};


// runs the program to get json files containing all sketch infos
function getGitHubData(URL) {
    const meURLs = getGitHubURLs(URL);
    axios.all([meURLs])
        .then(axios.spread(function(sketchURLs) {
            getFiles(sketchURLs);
            return "got 'em"
        }))
        .catch(function(error) {
            console.log(error);
        });;
}

function timer() {
    let count = 0;
    cron.job('* */10 * * * *', function() {
        count += 1;
        //for some reason this doesn't log if the server is app.listening
        // unless you've hit the rate limit, then it tells you
        // further investigation required
        // console.log("cron iteration: " + count)
        // console.log(new Date().getSeconds())
        getGitHubData(URL);
    });
}


// START THE SERVER
function init() {
    getGitHubData(URL); // get fresh sketch JSONs on initialization
    timer(); // run cron job every whatever minutes
    const server = app.listen(PORT);
    // console.log('Magic happens on port ' + PORT);


}

init()
