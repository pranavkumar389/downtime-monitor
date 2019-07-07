/**
 * These are CLI related text
 */

// Dependencies
var readline = require('readline');
var events = require('events');
var os = require('os');
var v8 = require('v8');
var _data = require('./data');
var _logs = require('./logs');
var helpers = require('./helpers');

class _events extends events { };
var e = new _events();

// Instantiate the CLI module object
var cli = {};


// Input handler
e.on('man', function () {
    cli.responders.help();
});
e.on('help', function () {
    cli.responders.help();
});
e.on('exit', function () {
    cli.responders.exit();
})
e.on('stats', function (str) {
    cli.responders.stats();
})
e.on('list users', function () {
    cli.responders.listUsers();
})
e.on('more user info', function (str) {
    cli.responders.moreUserInfo(str);
})
e.on('list checks', function (str) {
    cli.responders.listChecks(str);
});
e.on('more check info', function (str) {
    cli.responders.moreCheckInfo(str);
})
e.on('list logs', function (str) {
    cli.responders.listLogs();
})
e.on('more log info', function (str) {
    cli.responders.moreInfoLogs(str);
})


// Responders object
cli.responders = {};


// Help / Man
cli.responders.help = function () {
    var commands = {
        'exit': 'Kill the CLI (and the rest of the application)',
        'man': 'Show this help page',
        'help': 'Alias of the "man" command',
        'stats': 'get statistics on the underlying operating system and resource utilization',
        'list users': 'Show a list of all the registered (undeleted) users in the system',
        'more user info --{userId}': 'Show details of a specific user',
        'list checks --up --down': 'Show a list of all the active checks in the system, including their state. The "--up" and the "--down" flags are both optional',
        'more check info --{checkId}': 'Show details of a specified check',
        'list logs': 'Show the list of all the log files available to be read (compressed only)',
        'more log info --{fileName}': 'Shoe details of a specified log file'
    };

    // Show a header for the help page that is as wide as the screen
    cli.horizontalLine();
    cli.centered('CLI MANUAL');
    cli.horizontalLine();
    cli.verticalSpace(2);

    // Show each command, followed by its explanation, in white and yellow respectively
    for (var key in commands) {
        if (commands.hasOwnProperty(key)) {
            var value = commands[key];
            var line = '\x1b[33m' + key + '\x1b[0m';
            var padding = 60 - line.length;
            for (let i = 0; i < padding; i++) {
                line += ' ';
            }
            line += value;
            console.log(line);
            cli.verticalSpace();
        }
    }
    cli.verticalSpace(1);

    // End with another horizontal line
    cli.horizontalLine();

};

// Create a veritical space
cli.verticalSpace = function (lines) {
    lines = typeof (lines) !== 'undefined' && lines > 0 ? lines : 1;
    for (i = 0; i < lines; i++) {
        console.log('');
    }
};

// Create a horizontal line across the screen
cli.horizontalLine = function () {
    // Get the available screen size
    var width = process.stdout.columns;

    var line = '';
    for (i = 0; i < width; i++) {
        line += '-';
    }
    console.log(line);
};

// Create centered text on the screen
cli.centered = function (str) {
    str = typeof (str) !== 'undefined' && str.trim().length > 0 ? str.trim() : '';

    // Get the available screen size
    var width = process.stdout.columns;

    // Calculate the left padding there should be
    var leftPadding = Math.floor((width - str.length) / 2);

    // Put in left padded speces before the string itself
    var line = '';
    for (i = 0; i < leftPadding; i++) {
        line += ' ';
    }
    line += str;
    console.log(line);
}


// Exit
cli.responders.exit = function () {
    process.exit(0);
};

// stats
cli.responders.stats = function () {
    // Compile an object of stats
    var stats = {
        'Load Average': os.loadavg().join(' '),
        'CPU Count': os.cpus().length,
        'Free Memory': os.freemem(),
        'Current Mallocked Memory': v8.getHeapStatistics().malloced_memory,
        'Peak Mallocked Memory': v8.getHeapStatistics().peak_malloced_memory,
        'Allocated Heap Used (%)': Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),
        'Available Heap Allocated (%)': Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),
        'Uptime': os.uptime() + ' Seconds'
    };

    // Show a header for the stats page that is as wide as the screen
    cli.horizontalLine();
    cli.centered('SYSTEM STATISTICS');
    cli.horizontalLine();
    cli.verticalSpace(2);

    // Show each stats, followed by its explanation, in white and yellow respectively
    for (var key in stats) {
        if (stats.hasOwnProperty(key)) {
            var value = stats[key];
            var line = '\x1b[33m' + key + '\x1b[0m';
            var padding = 60 - line.length;
            for (let i = 0; i < padding; i++) {
                line += ' ';
            }
            line += value;
            console.log(line);
            cli.verticalSpace();
        }
    }
    cli.verticalSpace(1);

    // End with another horizontal line
    cli.horizontalLine();

};

// list users
cli.responders.listUsers = function () {
    _data.list('users', function (err, userIds) {
        if (!err && userIds && userIds.length > 0) {
            cli.verticalSpace();
            userIds.forEach(userId => {
                _data.read('users', userId, function (err, userData) {
                    if (!err && userData) {
                        var line = 'Name: ' + userData.firstName + ' ' + userData.lastName + ' Pnone: ' + userData.phone + ' Checks: ';
                        var numberOfChecks = typeof (userData.checks) === 'object' && userData.checks instanceof Array && userData.checks.length > 0 ? userData.checks.length : 0;
                        line += numberOfChecks;
                        console.log(line);
                        cli.verticalSpace();
                    }
                })
            });
        }
    })
};

// more user info
cli.responders.moreUserInfo = function (str) {
    // Get the user id from the str
    var arrStr = str.split('--');
    var userId = typeof (arrStr[1]) == 'string' && arrStr[1].length >= 0 ? arrStr[1] : false;
    if (userId) {
        // Lookup the user
        _data.read('users', userId, function (err, userData) {
            if (!err && userData) {
                // Delete the hash password
                delete userData.hashedPassword;

                // Print the JSON with text highlighting
                cli.verticalSpace();
                console.dir(userData, { 'colors': true });
                cli.verticalSpace();
            }
        })
    }
};

// list checks
cli.responders.listChecks = function (str) {
    _data.list('checks', function (err, checkIds) {
        if (!err && checkIds && checkIds.length > 0) {
            cli.verticalSpace();
            checkIds.forEach(function (checkId) {
                _data.read('checks', checkId, function (err, checkData) {
                    var lowerStr = str.toLowerCase();

                    // Get the state, default to down
                    var state = typeof (checkData.state) == 'string' ? checkData.state : 'down';

                    // Get the state, default to unknown
                    var stateOrUnknown = typeof (checkData.state) == 'string' ? checkData.state : 'unknown';

                    // If the user has specified the state, or hasn't specified any state, include the current check accordingly
                    if (lowerStr.indexOf('--' + state) > -1 || (lowerStr.indexOf('--down') == -1 && lowerStr.indexOf('--up') == -1)) {
                        var line = 'ID: ' + checkData.id + ' ' + checkData.method.toUpperCase() + ' ' + checkData.protocol + '://' + checkData.url + ' State: ' + stateOrUnknown;
                        console.log(line);
                        cli.verticalSpace();
                    }
                })
            })
        }
    })
};

// more check info
cli.responders.moreCheckInfo = function (str) {
    // Get the check id from the str
    var arrStr = str.split('--');
    var checkId = typeof (arrStr[1]) == 'string' && arrStr[1].length >= 0 ? arrStr[1] : false;
    if (checkId) {
        // Lookup the check
        _data.read('checks', checkId, function (err, checkData) {
            if (!err && checkData) {
                // Print the JSON with text highlighting
                cli.verticalSpace();
                console.dir(checkData, { 'colors': true });
                cli.verticalSpace();
            }
        })
    }
};

// list logs
cli.responders.listLogs = function () {
    _logs.list(true, function (err, logFileNames) {
        if (!err && logFileNames && logFileNames.length > 0) {
            cli.verticalSpace();
            logFileNames.forEach(function (logFileName) {
                if (logFileName.indexOf('-') > -1) {
                    console.log(logFileName);
                    cli.verticalSpace();
                }
            })
        }
    })
};

// more list logs
cli.responders.moreInfoLogs = function (str) {
    // Get the log file name from the str
    var arrStr = str.split('--');
    var logFileName = typeof (arrStr[1]) == 'string' && arrStr[1].length >= 0 ? arrStr[1] : false;
    if (logFileName) {
        cli.verticalSpace();
        // Decompress the log
        _logs.decompress(logFileName, function (err, strData) {
            if (!err && strData) {
                // Split into lines
                var arr = strData.split('\n');
                arr.forEach(function (jsonString) {
                    var logObj = helpers.parseJsonToObject(jsonString);
                    if (logObj && JSON.stringify(logObj) !== '{}') {
                        console.dir(logObj, { 'colors': true });
                        cli.verticalSpace();
                    }
                })
            }
        })
    }
};



// Input processor
cli.processInput = function (str) {
    str = typeof (str) === 'string' && str.trim().length > 0 ? str.trim() : false;
    // Only want to process if the user actually wrote something. Otherwise igone it
    if (str) {
        // codify the unique strings that idenfy the unique operations allowed to be asked
        var uniqueInputs = [
            'man',
            'help',
            'exit',
            'stats',
            'list users',
            'more user info',
            'list checks',
            'more check info',
            'list logs',
            'more log info'
        ];

        // Go through the possible inputs, emit an event when a mactch is found
        var matchFound = false;
        var counter = 0;
        uniqueInputs.some(function (input) {
            if (str.toLowerCase().indexOf(input) > -1) {
                matchFound = true;
                // Emit an event matching the unique input, and include the full string given
                e.emit(input, str);
                return true;
            }
        });
        // If no matc found, tell the user to try again
        if (!matchFound) {
            console.log('Sorry! Try again');
        }
    }
};


// Init script
cli.init = function () {
    // Send the start message to the console, in dark blue
    console.log('\x1b[34m%s\x1b[0m', 'The CLI is running.');

    // Start the interface
    var _interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ''
    });

    // Create an initial prompt
    _interface.prompt();

    // Handle each line of input separately
    _interface.on('line', function (str) {
        // Send to the input processor
        cli.processInput(str);

        // Re-initialize the prompt afterwards
        _interface.prompt();
    });

    // If the user stops the CLI, kill the associated process
    _interface.on('close', function () {
        process.exit(0);
    });

};


// Export the module
module.exports = cli;