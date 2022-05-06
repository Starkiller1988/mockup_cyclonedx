const fs = require('fs');
const path = require('path');

main();

var error = false;

async function main() {
    let rawdata = fs.readFileSync(path.join("out", "bom.json"));
    let jsonData = JSON.parse(rawdata);

    const packageData = {
        name: jsonData["components"]["name"],
        json: jsonData["components"],
        hasLicense: false,
        hasExternalRefs: false
    };
    for (let x in packageData.json) {
        let package = packageData.json[x];
        if (!hasLicense(package)) {
            //TODO log packages without license
            continue;
        }
        if (!hasExternalRefs(package)) {
            //TODO log packages without external refs
            continue;
        }

        let copyright = retrieveCopyrightInformation(package);
        if (copyright !== "") {
            insertCopyrightInformation(package, copyright);
        }
        await Sleep(1000);       
    }
    //downloadLicenseInformation(packageData);
}

function Sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function insertCopyrightInformation(package, copyright) {
    //TODO Add functionality to insert copyright into pom.json
}

function extractCopyright(packageData) {
    //TODO Add extraction functionality
}

function hasLicense(package) {
    // Check if cdxgen found license
    return package["licenses"] !== []
}

function hasExternalRefs(package) {
    // Check if any external resources exist
    return typeof package["externalReferences"] !== 'undefined';
}


async function retrieveCopyrightInformation(package) {
    const extRefs = package["externalReferences"];
    let license = "";
    let copyright = "";
    for (let y in extRefs) {
        type = extRefs[y]["type"];
        url = extRefs[y]["url"];
        if (url.includes("github.com")) {
            license = await downloadLicenseFromGithub(url);
        } else {
            license = await downloadLicenseFromExternalWebsite(url);
        }
        // try {
        //     fs.writeFileSync(path.join("outlicenses", `${package.name}${y}.txt`), license);
        // } catch (err) {
        //     console.error(err);
        // }
        copyright = extractCopyright(license);
        if (copyright !== "") {
            return copyright;
        }
    }
    handleNoCopyrightFound(package);
    return "";
}

function handleNoCopyrightFound(package) {
    //TODO handle no copyright found
}

async function downloadLicenseFromGithub(url) {
    let reponame = filterRepoFromURL(url)
    //repos.push(reponame);            
    apilink = createAPILink(reponame);
    try {
        let resp = await makeGetRequest(apilink);
        for (let i = 0; i < resp["total_count"]; i++) {
            currentResult = resp["items"][i];
            resultName = currentResult["name"].toLowerCase();
            //TODO filter for actual license files only
            if (resultName.includes("license")) {
                let downloadInfo = await makeGetRequest(currentResult["url"]);
                let licenseFile = await makeGetRequest(downloadInfo["download_url"]);
                return licenseFile;
                //extractCopyright(licenseFile);
                //download: url -> extract downloadurl -> download Document -> extract copyright notice
            }
        }
    } catch (err) {
        console.error(err);
        console.log(apilink);
    }

}

function downloadLicenseFromExternalWebsite(url) {
    //TODO try to download other website and search for copyright notice
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
    var file = fs.createWriteStream('out/repos.txt');
    repos.forEach((v) => {
        file.write(v + "\n");
    });
    file.end();
}

function writeRespToFile(repos) {
    var file = fs.createWriteStream('out/resp.json');
    repos.forEach((v) => {
        file.write(v + "\n");
    });
    file.end();
}