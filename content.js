curword=null
lastpopup=null
lasthighlight=null
active=true
querylanguage="en"
stillinword=false
wordinfocache={"en":{}}
eventhandleradded=false
eventhandlerfunc=null
lastcontainer=null

chrome.storage.sync.get('language', data => {
  if(typeof(data.language)!=='undefined'){
	querylanguage=data.language;
	if(!(querylanguage in wordinfocache)){
		wordinfocache[querylanguage]={}
	}
  }
  return true
});

chrome.storage.onChanged.addListener(changes => {
  console.log("NEW LANGUAGE")
  if (changes.language && typeof(changes.language)!=='undefined') {
    querylanguage=changes.language.newValue
	if(!(querylanguage in wordinfocache)){
		wordinfocache[querylanguage]={}
	}
  }
  return true
});

chrome.runtime.onMessage.addListener(msgObj => {
	console.log("GOT MESSAGE")
	console.log(msgObj)
	if("active" in msgObj && msgObj["active"]==true && eventhandleradded==false){
		eventhandlerfunc=mouseMoveHandler
		document.addEventListener('mousemove', mouseMoveHandler);
		eventhandleradded=true
	}else if(eventhandleradded && "active" in msgObj && msgObj["active"]==false){
		document.removeEventListener('mousemove',mouseMoveHandler)
		eventhandleradded=false
		unwrapFromTag(curword,lasthighlight)
	}	
});

function mouseMoveHandler(event){
	x = event.pageX;
	y = event.pageY;
	curwordnew=getWordAtPoint(x, y)
	//console.log(curwordnew)
	if(curwordnew!=null && curword!=curwordnew[0] && curwordnew[0]!=null && curwordnew[0].trim()!="" ){
		console.log(curwordnew[0])
		if(lasthighlight!=null && curword!=null){
			unwrapFromTag(curword,lasthighlight)
		}
		if(curwordnew[1]!=null){
			wrapWordInTag(curwordnew[0],curwordnew[1])
		}
		curword=curwordnew[0]
	}else if(curwordnew==null){
		if(lasthighlight!=null && curword!=null){
			unwrapFromTag(curword,lasthighlight)
		}		
	}
}


function handleText(node,word) {
	var curtext = node.innerHTML;
	//console.log(curtext)
	if(word in wordinfocache[querylanguage]){
		curtext=curtext.replaceAll(word,"<span id=\"highlightcunei\" class=\"highlightcunei\" title=\""+wordinfocache[querylanguage][word]+"\">"+word+"</span>")
		node.innerHTML = curtext;
	}else{
		curtext=curtext.replaceAll(word,"<span id=\"highlightcunei\" class=\"highlightcunei\">"+word+"</span>")
		node.innerHTML = curtext;
		wordInformationFromWikidata(querylanguage,word,document.getElementById('highlightcunei'))
	}
	//console.log(curtext)   
}

function walk(node,word) {

  var child, next;
  switch (node.nodeType) {

    case 1:
      handleText(node,word);
      break;
    case 9:
    case 11:
      child = node.firstChild;
      while (child) {
        next = child.nextSibling;
        walk(child);
        child = next;
      }
      break;

    case 3:
      break;
  }
}

function cleanString(toclean){
	return toclean.replaceAll(",","").replaceAll("(","").replaceAll(")","").trim()
}

function expandRangeToNextWhitespace(range){
  lastchar=range.toString().charAt(range.toString().length-1)
  while(lastchar!=" " && lastchar!="\n" && range.startOffset+(range.endOffset-range.startOffset)<range.startContainer.length){
	range.setEnd(range.startContainer, range.endOffset+1)
	console.log(range.toString().charAt(range.toString().length-1))
	lastchar=range.toString().charAt(range.toString().length-1)
	//console.log("EXPAND: "+range.expand("character"))
	//range.select()
	//console.log(range)
  }
  if(range.startOffset>0){
	firstchar=range.toString().charAt(0)
	while(firstchar!=" " && range.startOffset>0){
		range.setStart(range.startContainer, range.startOffset-1)
		console.log(range.toString().charAt(range.toString().length-1))
		firstchar=range.toString().charAt(0)
		//console.log("EXPAND: "+range.expand("character"))
		//range.select()
		//console.log(range)
	}
 }
  lastcontainer=range.startContainer
  return range
}

function getWordAtPoint(x, y) {
  var range = document.caretRangeFromPoint(x, y);
  if(range!=null && range.startContainer!=lastcontainer){
	if (range.startContainer.nodeType === Node.TEXT_NODE) {
		range.expand('word');
		range=expandRangeToNextWhitespace(range)
		console.log(range)
		//console.log(range.toString().trim())
		//console.log(document.elementFromPoint(x,y))
		return [cleanString(range.toString()),range.startContainer.parentElement];
	}
  }
  return null;
}

function wrapWordInTag(word,parentElem){
	if(!stillinword){
		//console.log("WRAPPING.... "+word)
		curtext=parentElem.innerHTML
		if(!parentElem.classList.contains("highlightcunei")){
			walk(parentElem,word)
		}
		lasthighlight=parentElem
		stillinword=true
	}
}

function unwrapFromTag(word,parentElem){
	//curtext=parentElem.innerHTML
	if(stillinword){
		//console.log("UNWRAPPING.... "+word)
		$('.highlightcunei').each(function(i,obj){
			//console.log(obj)
			$(obj).contents().unwrap()
		});
		stillinword=false
	}
	//parentElem.innerHTML=curtext
}

function formatPopup(data,spanitem,word){
	console.log(wordinfocache)
	if(data==null){
		if(spanitem!=null){
			spanitem.setAttribute("title",word+" ("+querylanguage+") could temporarily not be resolved in Wikidata!")
		}
		wordinfocache[querylanguage][word]=word+" ("+querylanguage+") could temporarily not be resolved in Wikidata!"
		console.log(wordinfocache[querylanguage][word])
	}else if(data.length==0){
		if(spanitem!=null){
			spanitem.setAttribute("title",word+" ("+querylanguage+") not found in Wikidata")
		}
		wordinfocache[querylanguage][word]=word+" ("+querylanguage+") not found in Wikidata"
		console.log(querylanguage+": "+wordinfocache[querylanguage][word])
	}else{
		thetitle="<ul>"
		thetitletext={}
		for(item in data){
			thetitle+="<li><a href=\""+data[item]["l"]+"\">"+data[item]["lemma"]+"</a> ("+data[item]["lexcatlabel"]+") [<a href=\""+data[item]["senseval"]+"\">"+data[item]["senselabel"]+"</a>]</li>"
			thetitletext[data[item]["lemma"]+" ("+data[item]["lexcatlabel"]+") ["+data[item]["senselabel"]+"] \n"]=true
		}
		thetitle+="</ul>"
		console.log(thetitletext)
		thetext=""
		for(textpart in thetitletext){
			thetext+=textpart
		}
		spanitem.setAttribute("title",thetext.trim())
		wordinfocache[querylanguage][word]=thetext
		console.log(wordinfocache[querylanguage][word])
	}	
}


function wordInformationFromWikidata(lang,word,spanitem){
	//console.log(spanitem)
	query=word	
	limit=5
	var sparql = `
		  SELECT DISTINCT ?l ?lf ?senseval ?senselabel ?lexcatlabel ?lfgram ?gflabel (GROUP_CONCAT(DISTINCT ?lemmaa; separator=" / ") as ?lemma) WHERE {
			BIND(LCASE("${query}"@${lang}) as ?term)
			{?lang wdt:P218 "${lang}" . } UNION {?lang wdt:P219 "${lang}" . }
			?l rdf:type ontolex:LexicalEntry ;
			   dct:language ?lang ;
			   wikibase:lemma ?lemmaa;
			   ontolex:lexicalForm ?lf .
			OPTIONAL {?l wikibase:lexicalCategory ?lexcat . ?lexcat rdfs:label ?lexcatlabel . FILTER((LANG(?lexcatlabel))= "en") }
			?lf ontolex:representation ?rep .
			OPTIONAL {?lf wikibase:grammaticalFeature ?lfgram . ?lfgram rdfs:label ?gflabel . FILTER((LANG(?gflabel))= "en")}
			?l ontolex:sense ?sense . ?sense wdt:P5137 ?senseval . OPTIONAL { ?senseval rdfs:label ?senselabel . FILTER((LANG(?senselabel))= "en") }        
			FILTER(str(?rep)=lcase("${query}"))       
		  }
		  GROUP BY ?l ?lf ?senseval ?senselabel ?lexcatlabel ?lfgram ?gflabel
		  ORDER BY ?l ?lfgram ?sense ?senselabel 
		  LIMIT ${limit}
		`;
	  //sparql=sparql.replaceAll("${query}",word)
	  wikidataUrl = 'https://query.wikidata.org/sparql'
	  d3.sparql(wikidataUrl, sparql).then((data) => {
		//console.log(data);
		formatPopup(data,spanitem,word)
	  }).catch((error) => {
		console.log(error)
		formatPopup(null,spanitem,word)
	  });
}
