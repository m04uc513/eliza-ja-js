var fs = require('fs');
var ElizaCore = require('./ElizaCore');


/*
 * arg check
 */
if(process.argv.length < 4) {
    console.error("node elizaapp.js <script> <input>");
    process.on("exit", function() {
        process.exit(1);
    });
}

// debug
//process.argv.forEach(function(a, i) {
//    console.log("["+i+"] "+a);
//});


/*
 * config -- reading script file & loading to class
 */

var cffile = process.argv[2];
var script = JSON.parse(fs.readFileSync(cffile, 'utf8'));

var eliza = new ElizaCore(script);
//eliza.print();

/*
 * main loop -- reading input file
 */
var infile = process.argv[3];
var content = fs.readFileSync(infile, 'utf8');
var lines = content.split('\n');


//console.log(eliza.getInitial());

lines.forEach(function(line) {
    line = line.trim();
    if (!line) return;

    console.log("C: "+line);
    var reply = eliza.transform(line);
    console.log("E: "+reply);
});

//console.log(eliza.getFinal());



