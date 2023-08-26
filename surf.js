const call = require('./call');

async function handleImgPg(url, webPage$, type, parentInfo) {
  var infoDict = {};
  var imgLink;
  var imgValid;
  infoDict["picInfo"] = {};
  infoDict["parentInfo"] = {};
  infoDict["metaInfo"] = {};

  var imageAvatar = webPage$('.pure-img');
  if (imageAvatar.length != 0) {
    imgLink = imageAvatar.attr('src');
    imgValid = await call.checkImg(imgLink);
  } else {
    imgValid = false;
  }
  
  await call.wait(200);
  if (imgValid) {
    infoDict["picInfo"]['URL'] = url;
    infoDict['picInfo']['title'] = webPage$('h1').text();
    infoDict['picInfo']['uploader'] = null;
    infoDict['picInfo']['uploaderUrl'] = null;
    infoDict['picInfo']['uploadedDate'] = null;
    var uploadedInfo = webPage$("[style='height:60px;margin:1px;']");
    if (uploadedInfo.length != 0) {
        var uploaderInfo = uploadedInfo.find("div[style='text-align:right;']");
        if (uploaderInfo.length != 0) {
            var uploader = uploaderInfo.find('a[href]');
            if (uploader.length != 0) {
                infoDict['picInfo']['uploader'] = uploader.text();
                infoDict['picInfo']['uploaderUrl'] = uploader.attr('href');
            }
            var dateUploaded = uploaderInfo.find('span.greytext.small');
            if (dateUploaded.length != 0) {
                infoDict['picInfo']['uploadedDate'] = dateConverter(dateUploaded.text());
            }
        }
    }
    infoDict['picInfo']['votes'] = Number(webPage$('.votecount').text());
    infoDict['picInfo']['views'] = Number(webPage$('.viewsandcomments').text().split('\n')[1].split(' ')[0].trim());
    infoDict['picInfo']['picLists'] = {};
    infoDict['picInfo']['picTitle'] = imageAvatar.attr('title');
    infoDict['picInfo']['picAlt'] = imageAvatar.attr('alt');
    infoDict['picInfo']['picUrl'] = imgLink;
    infoDict['picInfo']['picHeight'] = Number(imageAvatar.attr('height'));
    infoDict['picInfo']['picWidth'] = Number(imageAvatar.attr('width'));


    var lists1 = webPage$("[style='margin-bottom:8px;float:left;width:100%;']");
        if (lists1.length != 0) {
            lists1.each(function(i, list1) {
                var list1Elem = webPage$(list1).find("a[href][style='font-size:20px;font-family: Bitter;']");
                infoDict['picInfo']['picLists'][list1Elem.text()] = list1Elem.attr('href');
            });
        }
    var lists2 = webPage$("[style='margin-bottom:6px;float:left;width:100%;']");
    if (lists2.length != 0) {
        lists2.each(function(i, list2) {
            list2Elem = webPage$(list2).find("a[href]").eq(1);
            var list2Name = list2Elem.text();
            var list2Url = list2Elem.attr('href');
            infoDict['picInfo']['picLists'][list2Name] = list2Url;
        })
    }


    // User information storage
    infoDict['metaInfo']['inputType'] = type;
    infoDict['metaInfo']['dateStored'] = getCurrentDate();

    // Parent information storage
    infoDict['parentInfo']['entityName'] = null;
    infoDict['parentInfo']['parentUrl'] = null;
    infoDict['parentInfo']['parentDesc'] = null;
    infoDict['parentInfo']['parentTags'] = {};

    if (parentInfo == null) {
      subjectAvatar = webPage$('.itemimageavatar');
      if (subjectAvatar.length != 0) {
        infoDict['parentInfo']['entityName'] = webPage$('.contentheader').find('a[href]:not(.itemimageavatar)').first().text();
        var parentURL = webPage$('.contentheader').find('a[href]:not(.itemimageavatar)').first().attr('href');
        await call.wait(200);
        var profileInfo = await getProfileInfo(parentURL);
        infoDict["parentInfo"] = profileInfo
      }


    } else {
      infoDict["parentInfo"] = parentInfo
    }
  return infoDict
  } else {
    throw new Error(url + " is invalid.");
  }

}


async function getProfileInfo(url) {
  var webPage$ = await call.returnPage(url);
  var parentInfo = {};
  parentInfo['entityName'] = webPage$(".itemheadingmedium").eq(0).text();
  parentInfo['parentUrl'] = url;
  parentInfo['parentDesc'] = null;
  parentInfo['parentTags'] = {};

  var desc = webPage$("#vidDescRemain");
  if (desc.length != 0) {
      parentInfo['parentDesc'] = desc.text().split('\n').join(' ');
  } else {
    var altDesc = webPage$("[style='line-height:1.4em;margin-bottom:10px;']");
    if (altDesc.length != 0) {
      parentInfo['parentDesc'] = altDesc.text().split('\n').join(' ');
    }
  }

  var tagRoot = webPage$("span#alltags")
  if (tagRoot) {
      var tags = tagRoot.children();
      tags.each(function(i, elem) {
          var textHolder = webPage$(elem.nextSibling).text();
          var number = textHolder.replace(/[^0-9]/g, "");
          parentInfo['parentTags'][webPage$(elem).text()] = Number(number);
      });
  }
  return parentInfo;

}


async function findProfileImg(webPage$) {
  var imgList = [];
  var pageTabList = [];

  var imgPage = webPage$(".picturesbutton").attr("href");
  if (!imgPage.includes("https://www.listal.com") && !imgPage.includes("http://www.listal.com")) {
    imgPage = "https://www.listal.com" + imgPage;
  }
  pageTabList.push(imgPage);

  var imgPage$ = await call.returnPage(imgPage);
  var pageTabsElem = imgPage$('.pages')
  if (pageTabsElem.length != 0) {
    var maxPages = parseInt(pageTabsElem.children('a[href]').eq(-2).text().split('»').join('').trim());
    // console.log("Max Pages:");
    // console.log(maxPages);
    for (let i = 2; i <= maxPages; i++) {
      pageTabList.push(imgPage + '/' + String(i));
    }
  }
  for (pageTab of pageTabList) {
    call.wait(100);
    var pageTab$ = await call.returnPage(pageTab);
    var elemList = pageTab$("[href*='/viewimage/']");

    elemList.each( function(i, elem) {
      var href = pageTab$(elem).attr('href');
      // console.log(href);
      if (!href.includes("https://www.listal.com") && !href.includes("http://www.listal.com")) {
          href = "https://www.listal.com" + href;
      }
      imgList.push(href);
    }); 
    // for (elem of elemList) {
    //   var href = elem.attr('href');
    //   if (!href.includes("https://www.listal.com") && !href.includes("http://www.listal.com")) {
    //       href = "https://www.listal.com" + href;
    //   }
    //   imgList.push(href);
    // }
  }

  return imgList;
}





function getCurrentDate() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateConverter(dateString) {
  var dateParts = dateString.split(" ");
  var timeParts = String(dateParts.slice(-1)).split(":");
  var year = parseInt(dateParts.slice(-2,-1));
  var monthNames = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"];
  var month = monthNames.indexOf(dateParts.slice(-3,-2));
  var day = parseInt(dateParts.slice(-4,-3));
  var hour = parseInt(timeParts[0]);
  var minute = parseInt(timeParts[1]);

  return new Date(year, month, day, hour, minute);
}



module.exports = {handleImgPg, findProfileImg, getProfileInfo}

