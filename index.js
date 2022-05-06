const fs = require('fs');
const jsonData = require('out/bom.json'); 

main();

var repolinks = [];
var repos = [];

async function main() {
    const packageData = {
        name: jsonData["components"]["name"],
        json: jsonData["components"],
        hasLicense: false,
        hasCopyright: false
    };
    parseJSON(packageData);
    downloadLicenseInformation(packageData);
}

function parseJSON(packageData) {    
    for (let x in packageData.json) {
        const package = packageData.json[x];
        // Check if cdxgen found license and repo link
        if (package["licenses"] !== [] && typeof package["externalReferences"] !== 'undefined') {
            checkForCopyright(package);
        }
    }
    
    // response = await makeGetRequest(url);
    // console.log(response);
    // if (response === undefined) {
    //     console.log(url);
    // }
   writeReposToFile(repos);
}

function checkForCopyright(package) {
    package.hasLicense = true;
    const extRefs = package["externalReferences"];  
    for (let y in extRefs) {
        if (!package.hasCopyright) {
            type = extRefs[y]["type"]
            url = extRefs[y]["url"]
            if (url.includes("github.com")) {
                getCopyrightFromGithub(url);
            } else {                
                // try to download other website and search for copyright notice
                getCopyrightFromExternalWebsite(url);
            }
        }
    }
}

function getCopyrightFromGithub(url) {
    let reponame = filterRepoFromURL(url)
    repos.push(reponame);            
    repolinks.push(createAPILink(reponame));
}

function filterRepoFromURL(url) {
    let re = new RegExp("github.com\/([\\w\-]+)\/([\\w\-\.]+)");
    url = re.exec(url);
    let user = url[1];
    let repo = url[2].replace(new RegExp(".git$"), "");
    return `${user}/${repo}`;
}

function createAPILink(repo) {
   return `https://api.github.com/search/code?q=license+repo:${repo}`;
}

function makeGetRequest(path) {
    return new Promise(function (resolve, reject) {
        const axios = require('axios');
        axios.get(path).then(
            (response) => {
                var result = response.data;
                console.log('Processing Request');
                resolve(result);
            },
                (error) => {
                reject(error);
            }
        );
    });
}

function writeReposToFile(repos) {
    var file = fs.createWriteStream('repos.txt');
    repos.forEach((v) => {
        file.write(v+"\n");
      });
    file.end();
}