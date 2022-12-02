curword=null
lastpopup=null
lasthighlight=null
active=true
wordinfocache={}


chrome.runtime.onMessage.addListener(msgObj => {
    active=msgObj.active
	if(active){
		document.addEventListener('mousemove', (event) => {
			x = event.pageX;
			y = event.pageY;
			curwordnew=getWordAtPoint(x, y)
			console.log(curwordnew)
			console.log(wordinfocache)
			if(curwordnew!=null && curword!=curwordnew[0] && curwordnew[0]!=null && curwordnew[0].trim()!="" ){
				console.log(curwordnew)
				if(curwordnew[1]!=null){
					wrapWordInTag(curwordnew[0],curwordnew[1])
				}
				if(lasthighlight!=null && curword!=null){
					unwrapFromTag(curword,lasthighlight)
				}
				curword=curwordnew[0]
			}else if(curwordnew==null){
				if(lasthighlight!=null && curword!=null){
					unwrapFromTag(curword,lasthighlight)
				}		
			}
		});
	}else{
		
	}	
});

function getWordAtPoint(x, y) {
  var range = document.caretRangeFromPoint(x, y);
  if (range!=null && range.startContainer.nodeType === Node.TEXT_NODE) {
    range.expand('word');
	console.log(range.toString().trim())
	console.log(document.elementFromPoint(x,y))
    return [range.toString().trim(),range.startContainer.parentElement];
  }
  return null;
}

function wrapWordInTag(word,parentElem){
	curtext=parentElem.innerHTML
	if(word in wordinfocache){
		curtext=curtext.replaceAll(word,"<span id=\"highlightcunei\" title=\""+wordinfocache[word]+"\">"+word+"</span>")
		parentElem.innerHTML=curtext
	}else{
		curtext=curtext.replaceAll(word,"<span id=\"highlightcunei\">"+word+"</span>")
		parentElem.innerHTML=curtext
		wordInformationFromWikidata("sux",word,document.getElementById('highlightcunei'))
	}
	lasthighlight=parentElem
}

function unwrapFromTag(word,parentElem){
	//curtext=parentElem.innerHTML
	$('#highlightcunei').contents().unwrap()
	//parentElem.innerHTML=curtext
}

function formatPopup(data,spanitem,word){
	if(data==null){
		spanitem.setAttribute("title",word+" could temporarily not be resolved in Wikidata!")
		wordinfocache[word]=word+" could temporarily not be resolved in Wikidata!"
	}else if(data.length==0){
		spanitem.setAttribute("title",word+" not found in Wikidata")
		wordinfocache[word]=word+" not found in Wikidata"
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
		wordinfocache[word]=thetext
	}	
}


function wordInformationFromWikidata(lang,word,spanitem){
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
		formatPopup(null,spanitem,word)
	  });
}