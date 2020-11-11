var sCover = document.getElementById("s-cover")

function popupMoreMenu() {
	sCover.hidden = false
	editor.blur()
}

function closeMoreMenu() {
	sCover.hidden = true
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
  
    document.body.removeChild(element);
}

function downCfgTemp() {
	//download config template
	download('template.json', 'template.json')
}