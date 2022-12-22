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

document.addEventListener("DOMContentLoaded", () => {
  	console.log("DOCUMENT READY")
	console.log(localStorage)
    if (localStorage.getItem('active')==true) {
		document.getElementById('active').checked=true;
    } else {
		document.getElementById('active').checked=false;
    }
	if (localStorage.getItem('language')) {
		val=localStorage.getItem('language')
		document.getElementById('language').value = val;
    }
});
