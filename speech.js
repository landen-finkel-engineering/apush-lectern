/* ============================================================================
   speech.js — turn printed text into something a voice can actually say.

   Displayed text and spoken text are NOT the same string. "1607–1754" should
   stay on screen as written and be *said* as "sixteen oh seven to seventeen
   fifty-four". Stray OCR marks should be seen (so you can tell the scan is
   rough) but never pronounced.

   Normalisation happens token by token so every display word keeps a known
   character range inside the spoken string. That mapping is what lets the
   reader highlight the exact word being spoken.
   ========================================================================== */

var ONES = ["zero","one","two","three","four","five","six","seven","eight","nine",
            "ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen",
            "seventeen","eighteen","nineteen"];
var TENS = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];

function under100(n){
  if(n < 20) return ONES[n];
  var t = TENS[Math.floor(n/10)], o = n % 10;
  return o ? t + "-" + ONES[o] : t;
}
function under1000(n){
  if(n < 100) return under100(n);
  var h = Math.floor(n/100), r = n % 100;
  return ONES[h] + " hundred" + (r ? " " + under100(r) : "");
}
function numWords(n){
  n = Math.floor(Math.abs(n));
  if(n === 0) return "zero";
  var out = [], units = [[1e9,"billion"],[1e6,"million"],[1e3,"thousand"]];
  for(var i=0;i<units.length;i++){
    if(n >= units[i][0]){
      out.push(under1000(Math.floor(n/units[i][0])) + " " + units[i][1]);
      n %= units[i][0];
    }
  }
  if(n) out.push(under1000(n));
  return out.join(" ");
}

// Years are said differently from counts: 1854 is "eighteen fifty-four", not
// "one thousand eight hundred fifty-four". This is most of what a history
// passage contains, so it matters more here than anywhere else.
function yearWords(y){
  if(y < 1000 || y > 2099) return numWords(y);
  var hi = Math.floor(y/100), lo = y % 100;
  if(y >= 2000 && y <= 2009) return "two thousand" + (lo ? " " + under100(lo) : "");
  if(lo === 0) return under100(hi) + " hundred";
  if(lo < 10)  return under100(hi) + " oh " + ONES[lo];
  return under100(hi) + " " + under100(lo);
}

var ORD = {one:"first", two:"second", three:"third", five:"fifth", eight:"eighth",
           nine:"ninth", twelve:"twelfth"};
function ordWords(n){
  var w = numWords(n), parts = w.split(/([\s-])/), i = parts.length - 1;
  var last = parts[i];
  if(ORD[last]) parts[i] = ORD[last];
  else if(/y$/.test(last)) parts[i] = last.slice(0,-1) + "ieth";
  else parts[i] = last + "th";
  return parts.join("");
}

var ABBR = {
  "u.s.":"U S", "u.s":"U S", "u.s.a.":"U S A", "usa":"U S A", "d.c.":"D C",
  "e.g.":"for example,", "i.e.":"that is,", "etc.":"et cetera", "vs.":"versus",
  "vs":"versus", "cf.":"compare", "c.":"circa", "ca.":"circa", "ibid.":"",
  "no.":"number", "pp.":"pages", "p.":"page", "ch.":"chapter", "fig.":"figure",
  "approx.":"approximately", "govt.":"government", "amer.":"American"
};

/* Convert ONE display token into what should be said for it.
   Returns "" when the token is unspeakable junk (stray OCR marks). */
function speakToken(tok){
  var t = String(tok);

  // typographic characters
  t = t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  t = t.replace(/…/g, ", ");
  t = t.replace(/­/g, "");                     // soft hyphen

  // Year ranges FIRST: the dash in "1607–1754" means "to", not a pause.
  t = t.replace(/\b(1\d{3}|20\d{2})\s*[-–—]\s*(1\d{3}|20\d{2})\b/g,
                function(_, a, b){ return yearWords(+a) + " to " + yearWords(+b); });

  t = t.replace(/[—–]/g, ", ");                // any other dash reads as a pause

  // whole-token abbreviations
  var bare = t.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9.]+$/g, "").toLowerCase();
  if(Object.prototype.hasOwnProperty.call(ABBR, bare)) {
    var lead = (t.match(/^[^A-Za-z0-9]+/) || [""])[0];
    var tail = (t.match(/[^A-Za-z0-9.]+$/) || [""])[0];
    return (lead + ABBR[bare] + tail).trim();
  }

  // coordinates and measures, before plain numbers get at them
  t = t.replace(/(\d+)\s*°/g, "$1 degrees ");
  t = t.replace(/(\d+)\s*[′']/g, "$1 minutes ");
  t = t.replace(/(\d+)\s*[″"]/g, "$1 seconds ");

  // currency
  t = t.replace(/\$\s*([\d,]+(?:\.\d+)?)/g, function(_, n){
    var v = parseFloat(n.replace(/,/g,""));
    return numWords(v) + " dollars";
  });
  t = t.replace(/£\s*([\d,]+)/g, function(_, n){ return numWords(parseFloat(n.replace(/,/g,""))) + " pounds"; });
  t = t.replace(/(\d[\d,]*)\s*¢/g, function(_, n){ return numWords(parseFloat(n.replace(/,/g,""))) + " cents"; });

  // loose symbols that carry meaning
  t = t.replace(/&/g, " and ").replace(/%/g, " percent").replace(/§/g, " section ")
       .replace(/\+/g, " plus ").replace(/=/g, " equals ").replace(/@/g, " at ");

  // ordinals
  t = t.replace(/\b(\d+)(st|nd|rd|th)\b/gi, function(_, n){ return ordWords(+n); });

  // bare years
  t = t.replace(/\b(1\d{3}|20\d{2})\b/g, function(m){ return yearWords(+m); });

  // remaining numbers, including grouped ones
  t = t.replace(/\b\d[\d,]*(?:\.\d+)?\b/g, function(m){
    var v = parseFloat(m.replace(/,/g, ""));
    if(!isFinite(v)) return "";
    if(Math.floor(v) !== v){
      var s = String(v).split(".");
      return numWords(+s[0]) + " point " + s[1].split("").map(function(d){ return ONES[+d]; }).join(" ");
    }
    return numWords(v);
  });

  // anything left that a voice cannot say: drop it rather than pronounce it
  t = t.replace(/[^A-Za-z0-9\s.,;:!?'"()\-]/g, " ");
  t = t.replace(/\s{2,}/g, " ").trim();

  // lone letters and bare punctuation are almost always scan noise
  var letters = t.replace(/[^A-Za-z]/g, "");
  var digits  = t.replace(/[^0-9]/g, "");
  if(!letters && !digits){
    // A token made ONLY of pause punctuation (a lone em dash, "...") becomes a
    // pause. Anything with other marks mixed in is scan noise: drop it, so a
    // stray "-\.\" is never read out as "dot".
    if(/^[\s,;:.!?—–…-]+$/.test(String(tok))){
      var pause = t.replace(/[^,;:.!?]/g, "");
      return pause ? pause.charAt(0) : ",";
    }
    return "";
  }
  if(letters.length === 1 && !digits && !/^[aAiI]$/.test(letters)) return "";

  return t;
}

/* Build the spoken form of a sentence plus the display-word -> spoken-range map.
   words[i] = {text, start, end} where start/end index into `spoken`. */
function speakable(display){
  var toks = String(display || "").split(/(\s+)/);
  var spoken = "", words = [];
  for(var i=0;i<toks.length;i++){
    if(/^\s*$/.test(toks[i])) continue;
    var said = speakToken(toks[i]);
    if(!said){ words.push({text: toks[i], start: -1, end: -1}); continue; }
    if(spoken) spoken += " ";
    var start = spoken.length;
    spoken += said;
    words.push({text: toks[i], start: start, end: spoken.length});
  }
  return {spoken: spoken, words: words};
}

if(typeof module !== "undefined" && module.exports){
  module.exports = {speakable, speakToken, numWords, yearWords, ordWords};
}
