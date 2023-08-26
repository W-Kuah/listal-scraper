const index = require('./index');

function start() {
    var args = process.argv
    if (args.length == 2) {
        console.log('----- Listal Scraper -----\n');
        console.log('Please insert a Listal URL that corresponds to:\n  - an Image\n  - a List\n  - or a Profile\n');
        console.log('   Picture:');
        console.log('       - Format: `https://www.listal.com/viewimage/xxxxxx`');
        console.log('         Example: `https://www.listal.com/viewimage/1298895`\n');
        console.log('   List:');
        console.log('       - Format: `https://www.listal.com/list/xxxxxx`');
        console.log('         Example: `https://www.listal.com/list/cats`\n');
        console.log('   Profile: ')
        console.log('       - Format 1: `https://www.listal.com/xxxxx`');
        console.log('         Example 1: `https://www.listal.com/johnny-depp`');
        console.log('       - Format 2: `https://www.listal.com/xxxxx/xxxxx`');
        console.log('         Example 1: `https://www.listal.com/art/mona-lisa`\n');
        console.log('The `x` should be any alphanumeric character or "-"');
        console.log('or "_" and there should be any number of `x`)\n');

    } else if (args.length == 3) {
        console.log(args[2]);
        if (checkFormat(args[2])) {
            console.log('Processing: ' + args[2] + '\n')
            index.typeSelector(args[2]);

        } else {
            console.log('==== Invalid ====\n');
            console.log(`Invalid Input: ${args[2]}`);
            console.log('URL format is invalid.');
            console.log('Ensure URL format matches the following...\n');
            console.log('   Picture:');
            console.log('       - Format: `https://www.listal.com/viewimage/xxxxxx`');
            console.log('         Example: `https://www.listal.com/viewimage/1913051`\n');
            console.log('   List:');
            console.log('       - Format: `https://www.listal.com/list/xxxxxx`');
            console.log('         Example: `https://www.listal.com/list/cats`\n');
            console.log('   Profile: ')
            console.log('       - Format 1: `https://www.listal.com/xxxxx`');
            console.log('         Example 1: `https://www.listal.com/johnny-depp`');
            console.log('       - Format 2: `https://www.listal.com/xxxxx/xxxxx`');
            console.log('         Example 1: `https://www.listal.com/art/mona-lisa`\n');
            console.log('The `x` should be any alphanumeric character or "-"');
            console.log('or "_" and there should be any number of `x`)\n');
        }

    } else {
        console.log('==== Invalid ====\n');
        console.log(`Invalid Input: ${args[2]}`);
        console.log('Please Input only 1 argument.\n');
        console.log('Example: `node scrape https://www.listal.com/viewimage/1913051`\n')
    }
}


function checkFormat(url) {
    // Define the regular expression patterns
  const pattern1 = /^https:\/\/www\.listal\.com\/[\w-]+$/;
  const pattern2 = /^https:\/\/www\.listal\.com\/[\w-]+\/[\w-]+$/;

  // Test the input URL against the patterns
  if (pattern1.test(url) || pattern2.test(url)) {
    return true; // URL matches the patterns
  } else {
    return false; // URL doesn't match the patterns
  }
}

start()