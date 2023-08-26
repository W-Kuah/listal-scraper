const cheerio = require("cheerio");
const axios = require("axios");
const puppeteer = require('puppeteer');
const fs = require('fs').promises;

const { RateLimiterMemory } = require("rate-limiter-flexible");

let rateLimiter = new RateLimiterMemory({
  points: 10, // Number of requests allowed
  duration: 1, // Per second
});

function updateRateLimit(points, duration) {
    rateLimiter = new RateLimiterMemory({
      points,
      duration,
    });
  }

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

async function returnPage(url) {
    // downloading the target web page
    // by performing an HTTP GET request in Axios
    try {
        await rateLimiter.consume(1);
        const axiosResponse = await axios.request({
            method: "GET",
            url: url,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
            },
            validateStatus: false
        });
        if (axiosResponse.status === 403 || axiosResponse.status === 429 || axiosResponse.status === 503) {
            updateRateLimit(0,1);
            console.log('Server-side rate limited active. Pausing all requests for 60 seconds.');
            await wait(60000);
            updateRateLimit(3,1);
            const $ = await returnPage(url);
            return $
        } else if (axiosResponse.status === 200 || axiosResponse.status === 404) {
            const $ = cheerio.load(axiosResponse.data);
            return $; 
        } else {
            console.log(`No Solution for code: ${axiosResponse.status}`);
        }
    } catch (error) {
        try {
            if (error.response.status === 403 || error.response.status === 429 || error.response.status === 503) {
                updateRateLimit(0,1);
                console.log('Server-side rate limited active. Pausing all requests for 60 seconds.');
                await wait(60000);
                updateRateLimit(3,1);
                const $ = await returnPage(url);
                return $
            }
        } catch (error1) {
            // Handle rate limit exceeded error
            // console.log(error1);
            console.log('Rate limit exceeded. Waiting...');
            await wait(5000);
            const $ = await returnPage(url);
            return $
        }  
    }
    
}


async function checkImg(url) {
  try {
    await rateLimiter.consume(1);
    // Fetch the image using Axios
    const response = await axios.head(url);
    // Check the response status code
        if (response.status === 200) {
        return true
        } else {
            return false
        }
    } catch (error) {
    // If there was an error and the error is 404 while fetching the image,
    // then it is not working.
        try {
            if (error.response.status === 404) {
                return false
            } else if (error.response.status === 403 || error.response.status === 429 || error.response.status === 503) {
                updateRateLimit(0,1);
                console.log('Server-side rate limited active. Pausing all requests for 60 seconds.');
                await wait(60000);
                updateRateLimit(3,1);
                const validImg = await checkImg(url);
                return validImg
            }
        } catch (error1) {
            // console.log(error);
            console.log('Rate limit exceeded. Waiting...');
            // console.log(url);
            await wait(5000);
            const validImg = await checkImg(url);
            return validImg
        }

    }
}

async function findListImg(URL) {
    // console.log("Finding List in: " + URL);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Get the selector for the "Load More" button
    const loadMoreButtonSelector = '.loadmoreitems';
    var imgListSelector = "[href*='/viewimage/']"

    var elemList;
    var elemCount;
    var newElemCount;

    var loadMoreButton;
    var loadMoreButtonExists;


    try {
        await rateLimiter.consume(1);
        await page.goto(URL);
        await wait(2000); 
    
    
        elemList = await page.$$(imgListSelector);
        elemCount = elemList.length;
        // console.log("elemCount:");
        // console.log(elemCount);
    
        loadMoreButton = await page.$$(loadMoreButtonSelector);
        loadMoreButtonExists = loadMoreButton.length != 0;
        // console.log("\nloadMoreButtonExists:");
        // console.log(loadMoreButtonExists);
    } catch (error) {
        console.log(error);
        await browser.close();
        await wait(5000);
        return findListImg(URL);
    }
  
    while (loadMoreButtonExists) {
        try {
            console.log("Load more button found. Re-evaluating Elements...");
            await rateLimiter.consume(1);
            // Click the "Load More" button using Puppeteer
            await page.click(loadMoreButtonSelector);
            await wait(2500);
            // Wait for the new content to load

            await rateLimiter.consume(1);
            elemList = await page.$$(imgListSelector);
            newElemCount = elemList.length;
            // console.log("\nelemCount:");
            // console.log(elemCount);

            await rateLimiter.consume(1);
            loadMoreButton = await page.$$(loadMoreButtonSelector);
            loadMoreButtonExists = loadMoreButton.length != 0;
            if (!loadMoreButtonExists) {
                if (newElemCount == elemCount) {
                    loadMoreButtonExists = true;
                    await wait(2500);
                }
            }
            // console.log("loadMoreButtonExists:");
            // console.log(loadMoreButtonExists);
            elemCount = newElemCount;
            // console.log("\nloadMoreButtonExists:");
            // console.log(loadMoreButtonExists);
        } catch (error) {
            //console.log("Error: ");
            //console.log(error);
            await wait(5000);
            loadMoreButtonExists = true;
        }
    }
    var urlList = [];
    for (elem of elemList) {
        var attr = await page.evaluate(el => el.getAttribute("href"), elem);
        if (!attr.includes("https://www.listal.com") && !attr.includes("http://www.listal.com")) {
            attr = "https://www.listal.com" + attr;
        }
        urlList.push(attr);
    }
    // Close the browser
    await browser.close();
    // console.log(urlList);
    // console.log("Length of List: " + urlList.length);
    return urlList
  
}

async function saveImage(filePath, imageUrl) {
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      if (response.status === 200) {
        await fs.writeFile(filePath, Buffer.from(response.data));
      } else {
        console.error(`Failed to download image from ${imageUrl}. Status code: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving image:', error.message);
    }
}



async function test() {
    var URL = "https://www.listal.com/list/cats"
    var imgList = await findListImg(URL);
    var imgListLength = imgList.length;
    console.log("Image List Length:");
    console.log(imgListLength);
}

// test();

module.exports = {returnPage, checkImg, findListImg, wait, saveImage}