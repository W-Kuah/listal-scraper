// index.js
const call = require('./call');
const surf = require('./surf');
const fs = require('fs').promises;
const os = require('os');



function getDownloadFolder() {
    const isWindows = os.platform() === 'win32';
    const isMac = os.platform() === 'darwin';
    const isLinux = os.platform() === 'linux';
  
    if (isWindows) {
        return `C:\\Users\\${os.userInfo().username}\\Downloads`;
    } else if (isMac) {
        return `/Users/${os.userInfo().username}/Downloads`;
    } else if (isLinux) {
        return `/home/${os.userInfo().username}/Downloads`;
    } else {
        throw new Error('Operating system not supported');

    }
  }

async function typeSelector(url) {
    var downloadFolder = getDownloadFolder();
    var urlSplit = url.split("/");
    var categ = urlSplit.slice(-1)[0];


    // Check if Listal page
    if (url.includes("www.listal.com")) {
        var webPage$ = await call.returnPage(url);
        var title = webPage$("title").text();
        // Check if Listal page is not "page not found"
        if (title != "Listal - List the stuff you love! Movies, TV, music, games and books") {
            if (url.includes("viewimage")) {
                await singleImageDL(url, categ, downloadFolder, webPage$);
            } else if (urlSplit[3].includes("list")) {
                await listDL(url, categ, downloadFolder);
            } else {
                var link = webPage$("link[rel='alternate']");
                if (link.length != 0) {
                    var linkText = link.attr("title");
                    if (linkText != " Listal RSS Feed" && linkText.includes("RSS Feed")) {
                        await profileDL(url, categ, downloadFolder, webPage$);
                    } else {
                        console.log('==== Invalid ====\n');
                        console.log(`Invalid URL: ${url}`);
                        console.log("This is not a valid listal page (must be an image, profile or list page).");
                    }
                } else {
                    console.log('==== Invalid ====\n');
                    console.log(`Invalid URL: ${url}`);
                    console.log("This is not a valid listal page (must be an image, profile or list page).");
                }
            }
        } else {
            console.log('==== Invalid ====\n');
            console.log(`Invalid URL: ${url}`);
            console.log("This is not a valid listal page (must be an image, profile or list page).");
        }
    } else {
        console.log('==== Invalid ====\n');
        console.log(`Invalid URL: ${url}`);
        console.log("This is not a listal page.");
    }
    console.log("\n")
}


async function singleImageDL(url, categ, downloadFolder, webPage$){
    console.log(`'${url}' is a single image.`);
    var downloadLoc = downloadFolder + "/Listal" + "/Single Images" + "/" + categ;

    try {
        await fs.mkdir(downloadLoc, { recursive: true });
        var info = await surf.handleImgPg(url, webPage$, 'single', null);

        var imagePath = downloadLoc + '/' + categ + '.jpg';
        var jsonPath = downloadLoc + '/' + categ + '.json';
        
        await saveFiles(imagePath, jsonPath, info);
        console.log('==== Resolved ====\n');
    } catch (error) {
        // console.log(error);
        console.log('==== Invalid ====\n');
        console.log(`Invalid URL: ${url}`);
        console.log("This is an invalid image.");
    }
    
}

async function listDL(url, categ, downloadFolder){
    console.log(`'${url}' is a list.`);
    var downloadLoc = downloadFolder + "/Listal" + "/List" + "/" + categ;
    var imgList = await call.findListImg(url);
    var errorLoc = downloadLoc + '/' + 'error.txt'
    fs.writeFile(errorLoc, '-- Error --', (err) => {
        if (err) {
          console.error('Error creating error file:', err);
        }
    });
    // console.log(imgList.length);
    try {
        await fs.mkdir(downloadLoc, { recursive: true });
        for (img of imgList) {
            try {
                var imgWebPage$ = await call.returnPage(img);
                // console.log(img);
                var info = await surf.handleImgPg(img, imgWebPage$, 'list', null);
                var id = info['picInfo']['URL'].split('/').slice(-1)[0];

                var imagePath = downloadLoc + '/' + id + '.jpg';
                var jsonPath = downloadLoc + '/' + id + '.json';

                await saveFiles(imagePath, jsonPath, info);
                // console.log(info);
            } catch (error1) {
                // console.log(error1);
                var msg = 'Profile: Invalid Image (' + img + ')'
                console.log(msg);
                fs.appendFile(errorLoc, '\n' + msg, (err) => {
                    if (err) {
                      console.error('Error appending to file:', err);
                    }
                });
            }
            
        }
        console.log('==== Resolved ====');
    } catch (error) {
        // console.log(error);
        console.log('==== Invalid ====\n');
        console.log(`Invalid URL: ${url}`);
        console.log("This is an invalid list.");
    }
    

}


async function profileDL(url, categ, downloadFolder, webPage$){
    console.log(`'${url}' is a profile.`);
    var downloadLoc = downloadFolder + "/Listal" + "/Profile" + "/" + categ;
    var imgList = await surf.findProfileImg(webPage$);
    var profileInfo = await surf.getProfileInfo(url);
    var errorLoc = downloadLoc + '/' + 'error.txt'
    fs.writeFile(errorLoc, '-- Error --', (err) => {
        if (err) {
          console.error('Error creating error file:', err);
        }
    });

    try {
        await fs.mkdir(downloadLoc, { recursive: true });
        for (img of imgList) {
            try {
                var imgWebPage$ = await call.returnPage(img);
                var info = await surf.handleImgPg(img, imgWebPage$, 'profile', profileInfo);
                var id = info['picInfo']['URL'].split('/').slice(-1)[0];

                var imagePath = downloadLoc + '/' + id + '.jpg';
                var jsonPath = downloadLoc + '/' + id + '.json';
                // console.log(imagePath);
                // console.log(jsonPath);

                await saveFiles(imagePath, jsonPath, info);
                
                

            } catch (error1) {
                var msg = 'Profile: Invalid Image (' + img + ')'
                console.log(msg);
                fs.appendFile(errorLoc, '\n' + msg, (err) => {
                    if (err) {
                      console.error('Error appending to file:', err);
                    }
                });
            }
            
        }
        console.log('==== Resolved ====\n');
    } catch (error) {
        // console.log(error);
        console.log('==== Invalid ====\n');
        console.log(`Invalid URL: ${url}`);
        console.log("This is an invalid profile.")
    }
    
    
    
}


async function saveJson(filePath, dict) {
    try {
      const jsonString = JSON.stringify(dict, null, 2); // The second argument (null) is for replacer function, and the third argument (2) is for indentation.
      await fs.writeFile(filePath, jsonString, 'utf-8');
    } catch (error) {
      console.error('Error saving dictionary to JSON:', error.message);
    }
}


async function saveFiles(imagePath, jsonPath, dict) {
    var imgUrl = dict['picInfo']['picUrl'];
    // console.log(imgUrl);

    await saveJson(jsonPath, dict);
    await call.saveImage(imagePath, imgUrl);

}








async function test() {
    // await typeSelector("https://www.listal.com/johnny-depp"); // Should work
    // await typeSelector("https://www.listal.com/art/mona-lisa"); // Should work
    // await typeSelector("https://www.listal.com/movie/barbie-2018"); // Should work
    // await typeSelector("https://www.listal.com/johnny-deppt"); // Should not work 
    // await typeSelector("https://www.listal.com/list/cats"); // Should work
    // await typeSelector("https://www.listal.com/viewimage/273821"); // Should work
    // await typeSelector("https://www.listal.com/viewimage/1913051"); // Should work
    // await typeSelector("https://www.listal.com/viewimage/2729072O");// Should not work
    // await typeSelector("https://www.listal.com/"); // Should not work
    // await typeSelector("https://www.listal.com/ny-depp"); // Should not work
    // await typeSelector("https://www.lsistal.com/ny-depp"); // Should not work
    // await typeSelector("https://www.listal.com/movie/untitled-wes-anderson-film"); // Should work
    // console.log("Fin")
}


// test()
module.exports = {typeSelector}
