//file mgmt script
var fileContainer = document.getElementById("files-list")

var cFiles

const dispLen = 30

try {
	cFiles = JSON.parse(localStorage['cFiles'])
} catch(e) {
	cFiles = {}
}

var cEditing = null

function initFiles() {
	if (Object.keys(cFiles).length > 0) {
		Object.keys(cFiles).forEach((file, i) => {
			if (!file || typeof file === "undefined" || Object.keys(file).length < 1) {
				cFiles[file] = undefined
				return
			}
			addFile(file, cFiles[file])
		})
		updateLocal()
		//cEditing = Object.keys(cFiles)[0]
	}
}

function updateLocal() {
	localStorage['cFiles'] = JSON.stringify(cFiles)
}

function getIDfromName(name) {
	console.log(name)
	for (let i = 0; i < cFiles.length; i++) {
		if (cFiles[i].name == name) {
			return i
		}
	}
	return -1
}

function getIDfromNameFile(name) {
	return getIDfromName(name.slice(5))
}

function loadFile(name) {
	console.log(name)
	updateEditor(cFiles[name])
	cEditing = name
}

function addFile(name, dt) {

	//make file div
	let newFile = document.createElement('div')
	newFile.id = "file-" + name
	newFile.classList.add("fl")
	newFile.onclick = () => {
		loadFile(name)
	}

	//text
	let newFileName = document.createElement('p')
	if (name.length < dispLen)
		newFileName.innerHTML = name
	else
		newFileName.innerHTML = name.slice(0, dispLen)
	newFileName.style.cursor = "default"

	newFile.appendChild(newFileName)

	let newFileDel = document.createElement('button')
	newFileDel.innerHTML = "X"
	newFileDel.onclick = () => {
		deleteFile(newFile.id)
	}

	fileContainer.appendChild(newFile)
	fileContainer.appendChild(newFileDel)
}

function deleteFile(name) {
	let delTarget = document.getElementById(name)

	delete cFiles[name.slice(5)]

	fileContainer.removeChild(delTarget.nextSibling)
	fileContainer.removeChild(delTarget)

	if (cEditing == name) cEditing = null

	updateLocal()
}

function pushNewFile(name, dt) {
	if (Object.keys(cFiles).indexOf(name) > -1) {
		alert("File with name " + name + " already exists.")
		return null
	}
	cFiles[name] = dt
	updateLocal()
	return 0
}

function addFileFull(name, dt) {
	if (pushNewFile(name, dt) != null)
		addFile(name, dt)
}

function putBlankFile() {
	let fname = window.prompt("Input a file name:")
	if (fname == null) return
	addFileFull(fname || "untitled", "")
}

function putEditor() {
	let fname = window.prompt("Input a file name for this editor instance:")
	if (fname == null) return
	addFileFull(fname || "untitled", editor.getValue())
}

function putLoadedFile() {
	rfmode = "proj-file"
	up.click()
}

function saveFileBuffer() {
	downloadURI(JSON.stringify(cFiles), "z80proj.json")
}

function reqUpload(filetypes) {
	let oldAccept = up.accept
	up.accept = filetypes
	up.click()
	up.accept = oldAccept
}

function loadFileBuffer() {
	rfmode = "load-proj"
	reqUpload(".json")
}

function setNewFileBuffer(n) {
	cFiles = n
	updateLocal()

	//update DOM
	//clear old children
	fileContainer.innerHTML = ""

	//add new ones
	initFiles()

	cEditing = Object.keys(cFiles)[0]
	updateEditor(cFiles[Object.keys(cFiles)[0]])
}

function throwFileLoadException() {
	alert("Invalid project file selected. Load aborted.")
}