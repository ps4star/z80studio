//string manip functions
function lzfill(s, digits) {
	while (s.length < digits)
		s = "0" + s
	return s
}

function stringToASCII(str) {
    var bytes = []
    for(var i = 0; i < str.length; i++) {
        bytes.push(str.charCodeAt(i))
    }
    return bytes
}

//this is used for the swap instruction
function reverseString(str) {
    let newString = "";
    for (let i = str.length - 1; i >= 0; i--) {
        newString += str[i];
    }
    return newString;
}

//number conversion functions
function intToHex(d) {
	return d.toString(16)
}

function hexToInt(s) {
	return parseInt(s, 16)
}

function make16(a, b) {
	return (a * 256) + b
}

function getBit(i, n) {
	return Number(!!(i&(2**n)))
}

function setBit(i, n) {
	return i|2**n
}

function resetBit(i, n) {
	return i&~(2**n)
}

function modifyBit(i, n, b) {
	return b ? setBit(i, n) : resetBit(i, n)
}

//Handles NOT operations (used for cpl)
function inv8bit(n) {
	return (255 - n)
}

//Converts Uint8 to Int8 (unsigned -> signed)
function handleSignedUint8(n) {
	if (n > 127) {
		//is negative
		return -1 * (256 - n)
	}
	return n
}

var legalByteKeys = ["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"]
var legalBitKeys = ["0","1"]

var cHighlight = [0, 0]

const RAMsize = 65536

var parsedINS = {}

var modifyBuffer = ""
var rfmode = "editor"
var lastReadData = ""

//constructs a 2nd instruction set object which is regex-compatible
Object.keys(INS).forEach(k => {
	parsedINS[k.replace(/\*/g, "[0-9a-fA-F]{2}")] = INS[k]
})

var sys = {}

function initSys() {
	sys = {
		//RAM
		RAM : new Uint8Array(RAMsize),

		//Registers
		A : new Uint8Array(1),
		B : new Uint8Array(1),
		C : new Uint8Array(1),
		D : new Uint8Array(1),
		E : new Uint8Array(1),
		F : new Uint8Array(1),
		H : new Uint8Array(1),
		L : new Uint8Array(1),

		//Shadow Registers
		A_ : new Uint8Array(1),
		B_ : new Uint8Array(1),
		C_ : new Uint8Array(1),
		D_ : new Uint8Array(1),
		E_ : new Uint8Array(1),
		F_ : new Uint8Array(1),
		H_ : new Uint8Array(1),
		L_ : new Uint8Array(1),

		//Other
		SP : new Uint16Array(2),
		PC : new Uint16Array(2),
		IX : new Uint16Array(2),
		IY : new Uint16Array(2),

		//Ports
		ports : {}
	}
}

//general register mgmt (shad, etc.)
function swapSingleShad(name) {
	let tN = sys[name][0]
	sys[name][0] = sys[name+"_"][0]
	sys[name+"_"][0] = tN
}

function swapAllShad() {
	let tB = sys.B[0]
	let tC = sys.C[0]
	let tD = sys.D[0]
	let tE = sys.E[0]
	let tH = sys.H[0]
	let tL = sys.L[0]

	sys.B[0] = sys.B_[0]
	sys.C[0] = sys.C_[0]
	sys.D[0] = sys.D_[0]
	sys.E[0] = sys.E_[0]
	sys.H[0] = sys.H_[0]
	sys.L[0] = sys.L_[0]

	sys.B_[0] = tB
	sys.C_[0] = tC
	sys.D_[0] = tD
	sys.E_[0] = tE
	sys.H_[0] = tH
	sys.L_[0] = tL
}

//register get functions
function getA() {
	return sys.A[0]
}

function getB() {
	return sys.B[0]
}

function getC() {
	return sys.C[0]
}

function getD() {
	return sys.D[0]
}

function getE() {
	return sys.E[0]
}

function getH() {
	return sys.H[0]
}

function getL() {
	return sys.L[0]
}

function getF() {
	return sys.F[0]
}

function getPC() {
	return sys.PC[0]
}

function getSP() {
	return sys.SP[0]
}

function getIX() {
	return sys.IX[0]
}

function getIY() {
	return sys.IY[0]
}

//16 bit gets
function getAF() {
	return make16(sys.A[0], sys.F[0])
}

function getBC() {
	return make16(sys.B[0], sys.C[0])
}

function getDE() {
	return make16(sys.D[0], sys.E[0])
}

function getHL() {
	return make16(sys.H[0], sys.L[0])
}

//flag gets
function getSFlag() {
	return getBit(sys.F[0], 7)
}

function getZFlag() {
	return getBit(sys.F[0], 6)
}

function getHFlag() {
	return getBit(sys.F[0], 4)
}

function getPFlag() {
	return getBit(sys.F[0], 2)
}

function getNFlag() {
	return getBit(sys.F[0], 1)
}

function getCFlag() {
	return getBit(sys.F[0], 0)
}

//register update functions
function setA(b) {
	sys.A[0] = b
	if (!parseState.mode) return
	registers.A.value = lzfill(intToHex(sys.A[0]), 2)
}

function incA() {
	sys.A[0]++
	if (!parseState.mode) return
	registers.A.value = lzfill(intToHex(sys.A[0]), 2)
}

function setB(b) {
	sys.B[0] = b
	if (!parseState.mode) return
	registers.B.value = lzfill(intToHex(sys.B[0]), 2)
}

function setC(b) {
	sys.C[0] = b
	if (!parseState.mode) return
	registers.C.value = lzfill(intToHex(sys.C[0]), 2)
}

function setD(b) {
	sys.D[0] = b
	if (!parseState.mode) return
	registers.D.value = lzfill(intToHex(sys.D[0]), 2)
}

function setE(b) {
	sys.E[0] = b
	if (!parseState.mode) return
	registers.E.value = lzfill(intToHex(sys.E[0]), 2)
}

function setH(b) {
	sys.H[0] = b
	if (!parseState.mode) return
	registers.H.value = lzfill(intToHex(sys.H[0]), 2)
}

function setL(b) {
	sys.L[0] = b
	if (!parseState.mode) return
	registers.L.value = lzfill(intToHex(sys.L[0]), 2)
}

function incHL() {
	sys.L[0]++
	sys.H[0] += Number(sys.L[0] == 0)
	if (!parseState.mode) return
	registers.H.value = lzfill(intToHex(sys.H[0]), 2)
	registers.L.value = lzfill(intToHex(sys.L[0]), 2)
}

function addHL(n) {
	sys.L[0] += n
	sys.H[0] += Number(sys.L[0]-n > sys.L[0])
	if (!parseState.mode) return
	registers.H.value = lzfill(intToHex(sys.H[0]), 2)
	registers.L.value = lzfill(intToHex(sys.L[0]), 2)
}

function incDE() {
	sys.E[0]++
	sys.D[0] += Number(sys.E[0] == 0)
	if (!parseState.mode) return
	registers.D.value = lzfill(intToHex(sys.D[0]), 2)
	registers.E.value = lzfill(intToHex(sys.E[0]), 2)
}

function decBC() {
	sys.C[0]++
	sys.B[0] += Number(sys.C[0] == 0)
	if (!parseState.mode) return
	registers.B.value = lzfill(intToHex(sys.B[0]), 2)
	registers.C.value = lzfill(intToHex(sys.C[0]), 2)
}

//flag update functions (also modify F)
function setSFlag(bit) {
	sys.F[0] = modifyBit(sys.F[0], 7, bit)
	if (!parseState.mode) return
	flags.S.value = bit.toString()
}

function setZFlag(bit) {
	sys.F[0] = modifyBit(sys.F[0], 6, bit)
	if (!parseState.mode) return
	flags.Z.value = bit.toString()
}

function setHFlag(bit) {
	sys.F[0] = modifyBit(sys.F[0], 4, bit)
	if (!parseState.mode) return
	flags.H.value = bit.toString()
}

function setPFlag(bit) {
	sys.F[0] = modifyBit(sys.F[0], 2, bit)
	if (!parseState.mode) return
	flags.P.value = bit.toString()
}

function setNFlag(bit) {
	sys.F[0] = modifyBit(sys.F[0], 1, bit)
	if (!parseState.mode) return
	flags.N.value = bit.toString()
}

function setCFlag(bit) {
	sys.F[0] = modifyBit(sys.F[0], 0, bit)
	if (!parseState.mode) return
	flags.C.value = bit.toString()
}

function updateF() {
	if (!parseState.mode) return
	registers.F.value = lzfill(sys.F[0].toString(16), 2)
}

//16-bit registers
function getReg16(name) {
	return make16(sys[name.charAt(0)][0], sys[name.charAt(1)][0])
}

function getRAMat(val) {
	return sys.RAM[val]
}

function getRAMatReg(name) {
	return sys.RAM[sys[name.charAt(0)][0]*256 + sys[name.charAt(1)][0]]
}

function getRAMatHL() {
	return sys.RAM[sys.H[0]*256 + sys.L[0]]
}

function getRAMatSP() {
	return sys.RAM[sys.SP[0]]
}

//direct reg set instructions
function setReg(name, val) {
	sys[name][0] = val
	registers[name].value = lzfill(val.toString(16), 2)
}

function set16reg(name, val) {
	let asStr = val.toString(16)
	let c0 = name.charAt(0)
	let c1 = name.charAt(1)

	sys[c0][0] = Math.floor(val / 256)
	sys[c1][0] = val % 256
	if (!parseState.mode) return
	registers[c0].value = lzfill(sys[c0][0].toString(16).slice(0, 2), 2)
	registers[c1].value = lzfill(sys[c1][0].toString(16), 2)
}

function setSP(val) {
	sys.SP[0] = val
	if (!parseState.mode) return
	registers16.SP.value = lzfill(sys.SP[0].toString(16), 4)
}

function addSP(val) {
	sys.SP[0] += val
	if (!parseState.mode) return
	registers16.SP.value = lzfill(sys.SP[0].toString(16), 4)
}

function subSP(val) {
	sys.SP[0] -= val
	if (!parseState.mode) return
	registers16.SP.value = lzfill(sys.SP[0].toString(16), 4)
}

//SP mgmt instructions
function getSPdata() {
	//gets data on top of stack
	return make16(sys.RAM[sys.SP[0] + 2], sys.RAM[sys.SP[0] + 1])
}

function pushStack(n) {
	let h = Math.floor(n / 256)
	let l = n % 256

	sys.SP[0]--
	sys.RAM[sys.SP[0]] = h
	sys.SP[0]--
	sys.RAM[sys.SP[0]] = l

	if (!parseState.mode) return

	registers16.SP.value = lzfill(sys.SP[0].toString(16), 4)
	loadRAMtoTable()
}

function popStack() {
	let retVal = 0
	retVal = sys.RAM[sys.SP[0]]
	sys.SP[0]++
	retVal += sys.RAM[sys.SP[0]]*256
	sys.SP[0]++
	if (!parseState.mode) return retVal
	registers16.SP.value = lzfill(sys.SP[0].toString(16), 4)
	return retVal
}

//RAM mgmt
function setRAM(addr, byte) {
	sys.RAM[addr] = byte
	if (!parseState.mode) return
	loadRAMtoTable()
}

function addRAM(addr, val) {
	sys.RAM[addr] += val
	if (!parseState.mode) return
	loadRAMtoTable()
}

function subRAM(addr, val) {
	sys.RAM[addr] -= val
	if (!parseState.mode) return
	loadRAMtoTable()
}

function addReg(name, val) {
	sys[name][0] += val
	if (!parseState.mode) return
	registers[name].value = lzfill(intToHex(sys[name][0]), 2)
}

function subReg(name, val) {
	sys[name][0] -= val
	if (!parseState.mode) return
	registers[name].value = lzfill(intToHex(sys[name][0]), 2)
}

function add16reg(name, value) {
	let c0 = name.charAt(0)
	let c1 = name.charAt(1)

	let higherPart = sys[c0][0]
	let lowerPart = sys[c1][0]

	let totalValue = make16(higherPart, lowerPart)
	totalValue = lzfill(intToHex((totalValue + value) % 65536), 4)

	let h = totalValue.slice(0, 2)
	let l = totalValue.slice(2, 4)

	sys[c0][0] = parseInt(h, 16)
	sys[c1][0] = parseInt(l, 16)
	if (!parseState.mode) return
	registers[c0].value = h
	registers[c1].value = l
}

function sub16reg(name, value) {
	let higherPart = sys[name.charAt(0)][0]
	let lowerPart = sys[name.charAt(1)][0]

	let totalValue = make16(higherPart, lowerPart)
	let newIntValue = totalValue - value
	if (newIntValue < 0) {
		newIntValue = (0x10000 - Math.abs(newIntValue))
	}
	totalValue = lzfill(intToHex(newIntValue), 4)

	sys[name.charAt(0)][0] = parseInt(totalValue.slice(0, 2), 16)
	sys[name.charAt(1)][0] = parseInt(totalValue.slice(2, 4), 16)
	if (!parseState.mode) return
	registers[name.charAt(0)].value = lzfill(totalValue.slice(0, 2), 2)
	registers[name.charAt(1)].value = lzfill(totalValue.slice(2, 4), 2)
}

initSys()

var RAMtable = document.getElementById("RAM-viewer-table")
var gotoButton = document.getElementById("GOTO-button")
var gotoValue = document.getElementById("GOTO-VALUE")

var locationContainer = RAMtable.children[0].children[0].children[0]

var processViewer = document.getElementById("process-viewer")

var go_button = document.getElementById("go-button")
var step_button = document.getElementById("step-button")
var stop_button = document.getElementById("stop-button")
var help_button = document.getElementById("help-button")

function saveEditor() {
	localStorage['cont'] = editor.getValue()
}

function updateEditor(s) {
	editor.setValue(s)
	editor.clearSelection()
	editor.focus()
	saveEditor()
}

function updateEditorLang() {
	updateEditor(localStorage['cont'])
}

//reads in a file
function readF(e) {
	let input = e.target

	let reader = new FileReader()
	reader.onload = function() {
		let d = reader.result
		if (rfmode == "editor") {
			updateEditor(d)
		} else if (rfmode == "cfg") {
			setCfg(JSON.parse(d))
		} else {
			sys.ports[modifyBuffer].cBuffer = new Uint8Array(d)
			if (callbackFunc[0] == "click-step")
				stepButton.click()
			 else
				parseDocument(callbackFunc[1])
		}

	}
	
	if (rfmode == "editor" || rfmode == "cfg") {
		reader.readAsText(input.files[0])
	} else {
		reader.readAsArrayBuffer(input.files[0])
	}
}

function makeOverwriteByte(target, cID) {
	target.onclick = function() {
		this.selectionStart = 0
		this.selectionEnd = 0
	}
	target.onfocus = function() {
		this.selectionEnd = this.selectionStart
	}
	target.addEventListener('keypress', function(e) {
		e.preventDefault()

		if (legalByteKeys.indexOf(e.key.toUpperCase()) == -1) return

	    var s = this.selectionStart
	    this.value = this.value.substr(0, s) + e.key.toUpperCase() + this.value.substr(s + 1)
	    this.selectionEnd = s

	    this.selectionStart += 1

	    if (this.selectionStart >= 2) {
	    	this.selectionStart = 0
	    	this.selectionEnd = 0
	    	let parentEl = this.parentElement.parentElement.children
	    	parentEl[(cID+1) % parentEl.length].children[1].focus()
	    }
	}, false)
}

function makeOverwriteByteRAM(target, nextCell) {
	target.onclick = function() {
		this.selectionStart = 0
		this.selectionEnd = 0
	}
	target.onfocus = function() {
		this.selectionEnd = this.selectionStart
	}
	target.addEventListener('keypress', function(e) {
		e.preventDefault()

		if (legalByteKeys.indexOf(e.key.toUpperCase()) == -1) return

	    var s = this.selectionStart
	    this.value = this.value.substr(0, s) + e.key.toUpperCase() + this.value.substr(s + 1)
	    this.selectionEnd = s

	    this.selectionStart += 1

	    if (this.selectionStart >= 2) {
	    	nextCell.children[0].focus()
	    }
	}, false)
}

function makeOverwriteBit(target, cID) {
	target.onclick = function() {
		this.selectionStart = 0
		this.selectionEnd = 0
	}
	target.onfocus = function() {
		this.selectionEnd = this.selectionStart
	}
	target.addEventListener('keypress', function(e) {
		e.preventDefault()

		if (legalBitKeys.indexOf(e.key.toUpperCase()) == -1) return

	    this.value = e.key.toUpperCase()
		this.selectionStart = 0
    	this.selectionEnd = 0
    	let parentEl = this.parentElement.parentElement.children
    	parentEl[(cID+1) % parentEl.length].children[0].focus()
	}, false)
}

function makeOverwriteWord(target) {
	target.onclick = function() {
		this.selectionStart = 0
		this.selectionEnd = 0
	}
	target.onfocus = function() {
		this.selectionEnd = this.selectionStart
	}
	target.addEventListener('keypress', function(e) {
		e.preventDefault()

		if (legalByteKeys.indexOf(e.key.toUpperCase()) == -1) return

	    var s = this.selectionStart
	    this.value = this.value.substr(0, s) + e.key.toUpperCase() + this.value.substr(s + 1)
	    this.selectionEnd = s

	    this.selectionStart += 1

	    if (this.selectionStart >= 4) {
	    	this.selectionStart = 0
	    	this.selectionEnd = 0
	    }
	}, false)
}

function makeOverwriteWordR16(target, i) {
	target.onclick = function() {
		this.selectionStart = 0
		this.selectionEnd = 0
	}
	target.onfocus = function() {
		this.selectionEnd = this.selectionStart
	}
	target.addEventListener('keypress', function(e) {
		e.preventDefault()

		if (legalByteKeys.indexOf(e.key.toUpperCase()) == -1) return

	    var s = this.selectionStart
	    this.value = this.value.substr(0, s) + e.key.toUpperCase() + this.value.substr(s + 1)
	    this.selectionEnd = s

	    this.selectionStart += 1

	    if (this.selectionStart >= 4) {
	    	this.selectionStart = 0
	    	this.selectionEnd = 0

	    	this.parentElement.parentElement.children[(i+1) % 4].children[1].focus()
	    }
	}, false)
}

function getRAMcell(x, y) { //both values are on the interval [0, 15]
	return RAMtable.children[0].children[1 + y].children[1 + x]
}

function clearRAMcellHighlight() {
	getRAMcell(cHighlight[0], cHighlight[1]).style.backgroundColor = "#d3d3d3"
}

function highlightCell(col, row) {
	clearRAMcellHighlight()
	cHighlight = [col, row]
	getRAMcell(col, row).style.backgroundColor = "red"
}

function loadRAMtoTable(requestedCellAddr, mode) {
	if (mode != undefined && !mode) return
	requestedCellAddr = requestedCellAddr || null
	if (requestedCellAddr != null) processViewer.scrollBy(0, 999)
	for (let row = 0; row < 16; row++) {
		for (let col = 0; col < 16; col++) {
			let finalAddr = (hexToInt(gotoValue.value.slice(0, 2)) * 256) + (16 * row) + col
			let currentCell = getRAMcell(col, row).children[0]
			if (requestedCellAddr != null && requestedCellAddr == finalAddr) {
				highlightCell(col, row)
			}
			if (finalAddr > RAMsize) {
				currentCell.value = "??"
			} else {
				currentCell.value = lzfill(intToHex(sys.RAM[finalAddr]), 2)
			}
		}
	}
}

function updateRegisters() {
	Object.keys(registers).forEach(r => {
		registers[r].value = lzfill(sys[r][0].toString(16), 2)
	})
	Object.keys(registers16).forEach(r => {
		registers16[r].value = lzfill(sys[r][0].toString(16), 4)
	})
	flags.S.value = getBit(sys.F[0], 7)
	flags.Z.value = getBit(sys.F[0], 6)
	flags.H.value = getBit(sys.F[0], 4)
	flags.P.value = getBit(sys.F[0], 2)
	flags.N.value = getBit(sys.F[0], 1)
	flags.C.value = getBit(sys.F[0], 0)
}

function clearRegisters() {
	Object.keys(registers).forEach(r => {
		registers[r].value = "00"
	})
	Object.keys(flags).forEach(f => {
		flags[f].value = "0"
	})
}

function clearOtherRegisters() {
	Object.keys(registers16).forEach(r => {
		registers16[r].value = "0000"
	})
}

function clearSys() {
	//resets the system state
	//reset sys state by re-initting
	initSys()

	//write new RAM to viewer
	loadRAMtoTable()

	//reset registers' apparent values
	clearRegisters()

	//reset other registers (SP/I*)
	clearOtherRegisters()

	//clear SP
	registers16.SP.value = "FFFF"

	//clear ports
	initPorts()
}

function clearSys1() {
	initSys()
	initPorts()
}

function clearSys2() {
	loadRAMtoTable()
	clearRegisters()
	clearOtherRegisters()

	registers16.SP.value = "FFFF"
}

function clearRAMcellHighlight() {
	getRAMcell(cHighlight[0], cHighlight[1]).style.backgroundColor = "#d3d3d3"
}

window.addEventListener('mousedown', function() {
	if (!editor.getReadOnly()) clearRAMcellHighlight()
})

var editor = ace.edit("ace-editor")
var Range = ace.require('ace/range').Range

editor.setTheme("ace/theme/monokai")
editor.session.setMode("ace/mode/assembly_x86")

editor.setFontSize(localStorage['fsize'] || 20)

editor.setOption("showPrintMargin", false)

editor.session.setUseWrapMode(true)

const defStr = `.cfg 00.type text
.cfg 01.type audio
.cfg 02.type flashROM
.cfg 02.src upload

.define @port_prompt $00
.define @port_sound $01
.define @port_flash $02

jp _main

@promptString:
    .db "Welcome to Z80 Studio. Please upload an 8-bit wav file and this script will play it."

_PromptS:
    ld a, (hl)
    inc hl
    cp $00
    ret z
    out (@port_prompt), a
    jp _PromptS

_PlaySound:
    in a, (@port_flash)
    cp $00
    ret z
    out (@port_sound), a
    jp _PlaySound

_main:
    ld hl, @promptString
    call _PromptS

    call _PlaySound`

if (localStorage['cont'] != 'undefined' && typeof localStorage['cont'] !== 'undefined') {
	updateEditor(localStorage['cont'])
} else {
	updateEditor(defStr)
}

document.getElementById("ace-editor").addEventListener('keydown', function(e) {
	let lastLine = editor.session.doc.getLine(editor.getCursorPosition().row)
	if (e.key == "Enter" && lastLine.charAt(lastLine.length-1) == ":") {
		e.preventDefault()
		editor.insert("\n\t")
	}
})

let keysDown = []

window.onkeydown = function(e) {
	keysDown.push(e.key)
	if (e.key == "G" && keysDown.indexOf("Alt") > -1 && keysDown.indexOf("Shift") > -1) {
		go_button.click()
	} else if (e.key == "S" && keysDown.indexOf("Alt") > -1 && keysDown.indexOf("Shift") > -1) {
		step_button.click()
	} else if (e.key == "X" && keysDown.indexOf("Alt") > -1 && keysDown.indexOf("Shift") > -1) {
		stop_button.click()
	} else if (e.key == "H" && keysDown.indexOf("Alt") > -1 && keysDown.indexOf("Shift") > -1) {
		help_button.click()
	} else if (e.key == "+" && keysDown.indexOf("Alt") > -1 && keysDown.indexOf("Shift") > -1) {
		editor.setFontSize(parseInt(editor.getFontSize()) + 1)
		localStorage['fsize'] = editor.getFontSize()
	} else if (e.key == "_" && keysDown.indexOf("Alt") > -1 && keysDown.indexOf("Shift") > -1) {
		editor.setFontSize(parseInt(editor.getFontSize()) - 1)
		localStorage['fsize'] = editor.getFontSize()
	} else if (e.key == "F11") {
		e.preventDefault()
		editor.container.webkitRequestFullscreen()
	}
}

window.onkeyup = function(e) {
	localStorage['cont'] = editor.getValue()
	while (keysDown.indexOf(e.key) > -1)
		delete keysDown[keysDown.indexOf(e.key)]
}

//get important elements
//get register inputs
var registers = {
	A : document.getElementById("a-field"),
	B : document.getElementById("b-field"),
	C : document.getElementById("c-field"),
	D : document.getElementById("d-field"),
	E : document.getElementById("e-field"),
	H : document.getElementById("h-field"),
	L : document.getElementById("l-field"),
	F : document.getElementById("f-field")
}

var registers16 = {
	PC : document.getElementById("pc-16field"),
	SP : document.getElementById("sp-16field"),
	IX : document.getElementById("ix-16field"),
	IY : document.getElementById("iy-16field")
}

//get flag inputs
var flags = {
	S : document.getElementById("s-flag"),
	Z : document.getElementById("z-flag"),
	H : document.getElementById("h-flag"),
	P : document.getElementById("p-flag"),
	N : document.getElementById("n-flag"),
	C : document.getElementById("c-flag"),
}

const flagBitPositions = {
	S : 7,
	Z : 6,
	H : 4,
	P : 2,
	N : 1,
	C : 0
}

//set up reg/flag fields
Object.keys(registers).forEach((r, i) => {
	makeOverwriteByte(registers[r], i)
	if (r != "F") {
		registers[r].onkeypress = function() {
			sys[r][0] = hexToInt(this.value)
		}
	} else {
		registers[r].onkeypress = function() {
			let asInt = hexToInt(this.value)
			sys[r][0] = asInt
			flags.S.value = getBit(asInt, 7)
			flags.Z.value = getBit(asInt, 6)
			flags.H.value = getBit(asInt, 4)
			flags.P.value = getBit(asInt, 2)
			flags.N.value = getBit(asInt, 1)
			flags.C.value = getBit(asInt, 0)
		}
	}
})

Object.keys(registers16).forEach((r16, i) => {
	makeOverwriteWordR16(registers16[r16], i)
	registers16[r16].onkeypress = function() {
		sys[r16][0] = hexToInt(this.value)
	}
})

Object.keys(flags).forEach((f, i) => {
	makeOverwriteBit(flags[f], i)
	flags[f].onkeypress = function() {
		sys.F[0] = modifyBit(sys.F, flagBitPositions[f], parseInt(this.value))
		registers.F.value = lzfill(intToHex(sys.F), 2)
	}
})

//set all cells in RAM viewer table to overwrite fields
for (let row = 0; row < 16; row++) {
	for (let col = 0; col < 16; col++) {
		let currentCell = getRAMcell(col, row).children[0]
		let nextCellCoords = [col + 1, row]
		if (nextCellCoords[0] >= 16) {
			nextCellCoords[0] = 0
			nextCellCoords[1]++
			if (nextCellCoords[1] >= 16) {
				nextCellCoords = []
			}
		}
		let nxCell = getRAMcell(0, 0)
		if (nextCellCoords.length > 0) {
			nxCell = getRAMcell(nextCellCoords[0], nextCellCoords[1])
		}
		makeOverwriteByteRAM(currentCell, nxCell)
		currentCell.onkeypress = function() {
			let RAMaddr = hexToInt(gotoValue.value.slice(0, 2) + intToHex(row) + intToHex(col))
			sys.RAM[RAMaddr] = this.value
		}
	}
}

//set goto field to overwrite word field
makeOverwriteWord(gotoValue)

//sets goto button to update RAM table when clicked
gotoButton.onclick = () => {
	clearRAMcellHighlight()
	locationContainer.innerHTML = gotoValue.value.slice(0, 2)

	//updates RAM viewer and specifies cell to highlight (cell pointed to by gotoValue)
	loadRAMtoTable(hexToInt(gotoValue.value))
}

//shortcuts for clicking gotoButton using keys
gotoValue.addEventListener('keydown', function(e) {
	if (e.key == "Enter") {
		gotoButton.click()
	}
})

registers16.SP.value = "FFFF"