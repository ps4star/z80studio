var sCover = document.getElementById("s-cover")
var fCover = document.getElementById("s-cover-files")
var up = document.getElementById("upload-diag")

function popupMoreMenu() {
	sCover.style.display = "block"
	sCover.focus()
	editor.blur()
}

function popupFilesMenu() {
	fCover.style.display = "block"
	fCover.focus()
	editor.blur()
}

function closeMoreMenu() {
	sCover.style.display = "none"
	sCover.blur()
	editor.focus()
}

function closeFilesMenu() {
	fCover.style.display = "none"
	fCover.blur()
	editor.focus()
}

 function download(file, text) { 
              
    //creating an invisible element 
    var element = document.createElement('a');
    element.setAttribute('href',  
    'data:text/plain;charset=utf-8, ' 
    + encodeURIComponent(text))
    element.setAttribute('download', file)
  
    // Above code is equivalent to 
    // <a href="path of file" download="file name"> 
  
    document.body.appendChild(element)
  
    //onClick property 
    element.click()
  
    document.body.removeChild(element)
}

//download arbitrary data
function downloadURI(uri, name) {
	uri = "data:text/plain," + uri
	let link = document.createElement("a");
	link.download = name;
	link.href = uri;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

function openHelp() {
	window.open("help.html")
}

function openDocs() {
	window.open("4zdocs.html")
}

function openClrhome() {
	//opens clrhome instruction set table
	window.open("https://clrhome.org/table/")
}

function savePrgm() {
	let val = editor.getValue()
	let name = "program.txt"
	if (val.charAt(0) == ";") {
		name = val.slice(1, val.indexOf("\n"))
	}
	downloadURI(editor.getValue(), name)
}

function saveASM() {
	//save editor
	savePrgm()
}

function loadPrgm() {
	rfmode = "editor"
	up.click()
}