document.getElementById('language').onchange = function () {
console.log("LANGUAGE CHANGED!!!!")
chrome.tabs.query({}, (tabs) => tabs.forEach( tab => chrome.tabs.sendMessage(tab.id, {"language":this.value}) ) );
chrome.storage.sync.set({active: document.getElementById('active').checked,language: document.getElementById("language").value});
};
document.getElementById('active').onchange = function () {
console.log("ACTIVE CHANGED!!!!")
chrome.tabs.query({}, (tabs) => tabs.forEach( tab => chrome.tabs.sendMessage(tab.id, {"active":document.getElementById('active').checked}) ) );
chrome.storage.sync.set({active: document.getElementById('active').checked,language:document.getElementById("language").value});
};

window.addEventListener("load", (event) => {
  	console.log("DOCUMENT READY")
	chrome.storage.sync.get('active', function(data) {
		if(data.active==true){
			document.getElementById('active').checked=true;
		}else{
			document.getElementById('active').checked=false;		
		}
	});
	chrome.storage.sync.get('language', function(data) {
		val=data.language
		document.getElementById('language').value = val;
	});
});
