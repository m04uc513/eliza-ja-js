/*
  ElizaCore.js v.0.1 -- Japanese ELIZA JS Library (A.Fujita 2019)
*/

var TinySegmenter = require('./tiny_segmenter.js');
var ts = new TinySegmenter();

function ElizaCore(script) {
    this.mem = [];
    this.scr = script;    
    /*
    for (var i = 0; i < this.scr.key.length; i++) {
	console.log("# scr.key["+i+"].word = "+this.scr.key[i]);
	for (var j = 0; j < this.scr.key[i].decomp.length; j++) {
	    console.log("# this.scr.key["+i+"].decomp["+j+"].pattern = "
			  +this.scr.key[i].decomp[j].pattern);
	    console.log("# this.scr.key["+i+"].decomp["+j+"].curr = "
			  +this.scr.key[i].decomp[j].curr);
	}
    }
    */
}

ElizaCore.prototype.pre_conversion = function(pre, text) {
    for (var i = 0; i < pre.length; i++) {
	text=text.replace(pre[i][0], pre[i][1]);
    }
    //console.log("# pre: "+text);
    return text;
}

ElizaCore.prototype.post_conversion = function(post, rpl) {
    if (rpl == '') return rpl;
    for (var i = 0; i < post.length; i++) {
	rpl=rpl.replace(post[i][0], post[i][1]);
    }
    //console.log("# post: "+rpl);
    return rpl;
}

ElizaCore.prototype.pattern_match = function(pn, it) {
    var master = [];

    if (pn.indexOf('@') > 0) {
	var p = pn.split(' ');
	var l = -1;
	for (var k = 0; k < p.length; k++) {
	    if (p[k].indexOf('@') >= 0) l = k;
	}
	if (l == -1) return master;

	var sym = p[l].slice(1);
	var ali = [];
	for (var m = 0; m < this.scr.synon.length; m++) {
	    if (this.scr.synon[m][0] == sym) ali = this.scr.synon[m];
	}
	if (ali.length == 0) return master;

	for (var n = 0; n < ali.length; n++) {
	    p[l] = ali[n];
	    //console.log("### "+p.join(' '));
	    master = this.pattern_match(p.join(' '), it);
	    if (master.length > 0) return master;
	}
	return master;
    }

    var pat = pn.split(' ');
    //console.log("#0: "+pat);
    var words = [];
    pat.forEach(function(word) {
        if (word != '*') words.push(word);
    });
    //console.log("#1: "+words);

    //var inp = it.split(' ');
    var inp = ts.segment(it);
    //console.log("#2: "+inp);
    var pos = [];
    var i, j;
    for (i = 0, j = 0; i < words.length; i++) {
	var mwpf = true;
	for (; j < inp.length ; j++) {
	    if (inp[j] == words[i]) break;
	    var word = words[i];
	    if (word.indexOf('*') >= 0) {
		var mwp = '';
		if (word[0] == '*') {
		    mwp = word.slice(1);
		    if (inp[j].lastIndexOf(mwp) >= 0) {
			mwpf = false;
			break;
		    }
		} else if (word.lastIndexOf('*') == (word.length-1)) {
		    mwp = word.slice(0, word.lastIndexOf('*'));
		    if (inp[j].indexOf(mwp) >= 0) {
			mwpf = false;
			break;
		    }
		}
	    }
	}
	if (j == inp.length) {
	    //console.log("XX: '"+words[i]+"' not found.");
	    return master;
	}
	if (mwpf) {
	    pos.push(j);
	} else {
	    pos.push(-j);
	}
    }
    //console.log("#3: "+pos);

    var sub = [];
    for (j = 0, i = 0; j < inp.length; j++) {
	//console.log("# j = "+j);
	if (i < pos.length && j == Math.abs(pos[i])) {
	    //console.log("# i = "+i);
	    //console.log("# pos["+i+"] = "+pos[i]);
	    //console.log("#4.0: "+sub);
	    if (pos.length == 1 ||
		(i > 0  && Math.abs(pos[i-1]) != Math.abs(pos[i-1])-1)) {
		master.push(sub);
		sub = [];
	    }
	    if (pos[i] < 0) {
		sub.push(inp[j]);
		//console.log("#4.1: "+sub);
		master.push(sub);
		sub = [];
	    }
	    i++;
	    continue;
	}
	sub.push(inp[j]);
    }
    //console.log("#4.2: "+sub);
    master.push(sub);

    return master;
}

ElizaCore.prototype.reassemble = function(ar, msg) {
    var ret = [];
    //console.log(ar);
    //console.log("# msg = "+msg);
    if (msg.indexOf('%') < 0) {
	ret = msg;
    } else {
	var m = msg.split('%');
	var rpl = [];
	for (var j = 0; j < m.length; j++) {
	    if (m[j].length == 0) continue;
	    var n = Number(m[j]);
	    if (isNaN(n)) {
		rpl.push(m[j]);
	    } else {
		//console.log(ar);
		//console.log("# n = "+n);
		//console.log("# ar[n] = "+ar[n]);
		rpl.push(ar[n].join(''));
	    }
	}
	ret = rpl.join('');
    }
    //console.log("# "+i+": "+ret);
    return ret;
}

ElizaCore.prototype.execRule = function(k, input) {
    //console.log("# key: "+k.word);
    //console.log("# decomp: "+k.decomp.length);
    var rpl = [];
    for (var i = 0; i < k.decomp.length; i++) {
	//console.log("# k.decomp[i].pattern = "+k.decomp[i].pattern);
	//console.log("# k.decomp[i].curr = "+k.decomp[i].curr);
	var pat = k.decomp[i].pattern.split(' ');
	if (k.decomp[i].pattern == "*") {
	    rpl = k.decomp[i].reasmbl[k.decomp[i].curr];
	    //console.log("# rpl = "+rpl);
	    k.decomp[i].curr++; //console.log("# inc 0");
	    if (k.decomp[i].curr >= k.decomp[i].reasmbl.length) k.decomp[i].curr = 0;
	    break;
	} else if (pat[0] == "$") {
	    //console.log("# save to memory: "+k.decomp[i].pattern);
	    var ppp = pat;
	    ppp.shift();
	    //console.log("# ppp = "+ppp);
	    var a = this.pattern_match(ppp.join(' '), input);
	    //console.log(a);
	    if (a.length > 0) {
		//console.log("# k.decomp[i].curr = "+k.decomp[i].curr);
		//console.log("# k.decomp[i].reasmbl[k.decomp[i].curr] = "
		//              +k.decomp[i].reasmbl[k.decomp[i].curr]);
		rpl = this.reassemble(a,k.decomp[i].reasmbl[k.decomp[i].curr]);
		k.decomp[i].curr++; //console.log("# inc 1");
		if (k.decomp[i].curr >= k.decomp[i].reasmbl.length) k.decomp[i].curr = 0;

		// post conversion
		rpl = this.post_conversion(this.scr.post, rpl);

		//console.log("P: "+rpl);
		this.mem.push(rpl);
		rpm = [];
	    }
	} else {
	    var a = this.pattern_match(k.decomp[i].pattern, input);
	    if (a.length > 0) {
		//console.log("# decomp["+i+"].pattern: "+k.decomp[i].pattern);
		//console.log(a);
		//console.log("# decomp["+i+"].curr: "+k.decomp[i].curr);
		//console.log("# decomp["+i+"].reasmbl[k.decomp[i].curr]: "+
		//	    k.decomp[i].reasmbl[k.decomp[i].curr]);
		rpl = this.reassemble(a,k.decomp[i].reasmbl[k.decomp[i].curr]);
		k.decomp[i].curr++; //console.log("# inc 2");
		if (k.decomp[i].curr >= k.decomp[i].reasmbl.length) k.decomp[i].curr = 0;
		break;
	    }
	}
    }

    return rpl;
}

ElizaCore.prototype.execXnone = function(k, input) {
    //console.log("# key: "+k.word);
    //console.log("# decomp: "+k.decomp.length);
    var rpl = [];
    for (var i = 0; i < k.decomp.length; i++) {
	//console.log("# decomp["+i+"].pattern: "+k.decomp[i].pattern);
	if (k.decomp[i].pattern == "*") {
	    rpl = k.decomp[i].reasmbl[k.decomp[i].curr];
	    k.decomp[i].curr++; //console.log("# inc 3");
	    if (k.decomp[i].curr >= k.decomp[i].reasmbl.length) {
		k.decomp[i].curr = 0;
	    }
	    break;
	} else if (input.indexOf(k.decomp[i].pattern) >= 0) {
	    rpl = k.decomp[i].reasmbl[k.decomp[i].curr];
	    k.decomp[i].curr++; //console.log("# inc 4");
	    if (k.decomp[i].curr >= k.decomp[i].reasmbl.length) {
		k.decomp[i].curr = 0;
	    }
	    break;
	}
    }
    return rpl;
}

ElizaCore.prototype.transform = function(text) {
    var ret = '';

    // unify text string

    // pre conversion
    text = this.pre_conversion(this.scr.pre, text);

    // split text in part sentences and loop through them
    var parts = ts.segment(text);
    //var parts=text.split(' ');
    //console.log("# parts = "+parts.join('|'));

    // key, decomp, reasmbl
    for (var j = 0; j < this.scr.key.length; j++) {
	var rpl = '';
	var key = this.scr.key[j].word;
	//console.log("# key = "+key);
	if (key == "xnone") continue;

	for (var i = 0; i < parts.length; i++) {
	    var part = parts[i];
	    //console.log("# part = "+part);
	    if (part == key) {
		rpl = this.execRule(this.scr.key[j], text);
		break;
	    }
	}
	if (rpl == '')  continue;

	// goto function
	if (rpl.indexOf('goto') == 0) {
	    var parts = rpl.split(' ');
	    var part  = parts[1];
	    //console.log("# part = "+part);
	    for (var k = 0; k < this.scr.key.length; k++) {
		if (this.scr.key[k].word == part) {
		    rpl = this.execRule(this.scr.key[k], text);
		    break;
		}
	    }
	}

	// post conversion
	ret = this.post_conversion(this.scr.post, rpl);

	return ret;
    }

    if (rpl == '') {
	if (this.mem.length > 0) {
	    rpl = this.mem[0];
	    this.mem.shift();
	} else {
	    for (var j = 0; j < this.scr.key.length; j++) {
		if (this.scr.key[j].word != "xnone") continue;
		//console.log("### xnone");
		//console.log("# this.scr.key["+j+"].word:"
		//	    +this.scr.key[j].word);
		rpl = this.execXnone(this.scr.key[j], text);
		if (rpl != '') break;
	    }
	}
    }

    // post conversion
    ret = this.post_conversion(this.scr.post, rpl);

    return ret
}

module.exports = ElizaCore;
