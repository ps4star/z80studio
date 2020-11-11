//string manip functions
function lzfill(s, digits) {
	while (s.length < digits) {
		s = "0" + s
	}
	return s
}

function modifyCharAt(str, index, chr) {
    if (index > str.length-1) return str
    return str.substring(0,index) + chr + str.substring(index+1)
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

function getBit(i, b) {
	//gets specified bit of int i
	return parseInt(lzfill(i.toString(2), 8).charAt(7 - b))
}

function modifyBit(h, pos, newBit) {
	//takes an integer (hex rep.) and modifies specified bit
	//7 is lowest, 0 is highest
	let binNumber = lzfill(h.toString(2), 8)
	return parseInt(modifyCharAt(binNumber, (7 - pos), newBit), 2)
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

var sys = {}

function initSys() {
	sys = {
		//RAM
		RAM : new Uint8Array(new ArrayBuffer(RAMsize)),

		//Registers
		A : 0,
		B : 0,
		C : 0,
		D : 0,
		E : 0,
		F : 0,
		H : 0,
		L : 0,

		//Shadow Registers
		A_ : 0,
		B_ : 0,
		C_ : 0,
		D_ : 0,
		E_ : 0,
		F_ : 0,
		H_ : 0,
		L_ : 0,

		//Other
		SP : 65535,
		PC : 0,
		IX : 0,
		IY : 0

	}
}

//general register mgmt (shad, etc.)
function swapSingleShad(name) {
	let tN = sys[name]
	sys[name] = sys[name+"_"]
	sys[name+"_"] = tN
}

function swapAllShad() {
	let tA = sys.A
	let tB = sys.B
	let tC = sys.C
	let tD = sys.D
	let tE = sys.E
	let tF = sys.F
	let tH = sys.H
	let tL = sys.L

	sys.A = sys.A_
	sys.B = sys.B_
	sys.C = sys.C_
	sys.D = sys.D_
	sys.E = sys.E_
	sys.F = sys.F_
	sys.H = sys.H_
	sys.L = sys.L_

	sys.A_ = tA
	sys.B_ = tB
	sys.C_ = tC
	sys.D_ = tD
	sys.E_ = tE
	sys.F_ = tF
	sys.H_ = tH
	sys.L_ = tL
}

//register get functions
function getA() {
	return sys.A
}

function getB() {
	return sys.B
}

function getC() {
	return sys.C
}

function getD() {
	return sys.D
}

function getE() {
	return sys.E
}

function getH() {
	return sys.H
}

function getL() {
	return sys.L
}

function getF() {
	return sys.F
}

function getPC() {
	return sys.PC
}

function getSP() {
	return sys.SP
}

function getIX() {
	return sys.IX
}

function getIY() {
	return sys.IY
}

//16 bit gets
function getAF() {
	return make16(sys.A, sys.F)
}

function getBC() {
	return make16(sys.B, sys.C)
}

function getDE() {
	return make16(sys.D, sys.E)
}

function getHL() {
	return make16(sys.H, sys.L)
}

//register update functions
function setA(b) {
	sys.A = b
	registers.A.value = lzfill(intToHex(sys.A), 2)
}

function setB(b) {
	sys.B = b
	registers.B.value = lzfill(intToHex(sys.B), 2)
}

function setC(b) {
	sys.C = b
	registers.C.value = lzfill(intToHex(sys.C), 2)
}

function setD(b) {
	sys.D = b
	registers.D.value = lzfill(intToHex(sys.D), 2)
}

function setE(b) {
	sys.E = b
	registers.E.value = lzfill(intToHex(sys.E), 2)
}

function setH(b) {
	sys.H = b
	registers.H.value = lzfill(intToHex(sys.H), 2)
}

function setL(b) {
	sys.L = b
	registers.L.value = lzfill(intToHex(sys.L), 2)
}

//flag update functions (also modify F)
function setSFlag(bit) {
	sys.F = modifyBit(sys.F, 7, bit)
	flags.S.value = bit.toString()
}

function setZFlag(bit) {
	sys.F = modifyBit(sys.F, 6, bit)
	flags.Z.value = bit.toString()
}

function setHFlag(bit) {
	sys.F = modifyBit(sys.F, 4, bit)
	flags.H.value = bit.toString()
}

function setPFlag(bit) {
	sys.F = modifyBit(sys.F, 2, bit)
	flags.P.value = bit.toString()
}

function setAFlag(bit) {
	sys.F = modifyBit(sys.F, 1, bit)
	flags.A.value = bit.toString()
}

function setCFlag(bit) {
	sys.F = modifyBit(sys.F, 0, bit)
	flags.C.value = bit.toString()
}

//16-bit registers
function get16reg(name) {
	return make16(sys[name.charAt(0)], sys[name.charAt(1)])
}

function getRAMatReg(name) {
	return make16(sys.RAM[name.charAt(0)], sys.RAM[name.charAt(1)])
}

//direct reg set instructions
function setReg(name, val) {
	sys[name] = val
	registers[name].value = lzfill(val.toString(16), 2)
}

function set16reg(name, val) {
	let asStr = val.toString(16)
	let c0 = name.charAt(0)
	let c1 = name.charAt(1)

	sys[c0] = Math.floor(val / 256)
	sys[c1] = val % 256

	registers[c0].value = lzfill(sys[c0].toString(16).slice(0, 2), 2)
	registers[c1].value = lzfill(sys[c1].toString(16), 2)
}

//SP mgmt instructions
function pushReg(r) {
	sys.RAM[sys.SP - 2] = sys[r.charAt(0)]
	sys.RAM[sys.SP - 1] = sys[r.charAt(1)]
	sys.SP -= 2
	loadRAMtoTable()
}

function getSPdata() {
	//gets data on top of stack
	return make16(sys.RAM[sys.SP + 1], sys.RAM[sys.SP + 2])
}

function popStack(r) {
	set16reg(r, getSPdata())
	sys.SP += 2
}

function setRAM(addr, byte) {
	sys.RAM[addr] = byte
	loadRAMtoTable()
}

function addReg(name, val) {
	sys[name] = (sys[name] + val) % 256
	registers[name].value = lzfill(intToHex(sys[name]), 2)
}

function subReg(name, val) {
	sys[name] -= val
	if (sys[name] < 0) {
		sys[name] = (0x100 - Math.abs(sys[name]))
	}
	registers[name].value = lzfill(intToHex(sys[name]), 2)
}

function add16reg(name, value) {
	let c0 = name.charAt(0)
	let c1 = name.charAt(1)

	let higherPart = sys[c0]
	let lowerPart = sys[c1]

	let totalValue = make16(higherPart, lowerPart)
	totalValue = lzfill(intToHex((totalValue + value) % 65536), 4)

	let h = totalValue.slice(0, 2)
	let l = totalValue.slice(2, 4)

	sys[c0] = h
	registers[c0].value = h
	sys[c1] = l
	registers[c1].value = l
}

function sub16reg(name, value) {
	let higherPart = sys[name.charAt(0)]
	let lowerPart = sys[name.charAt(1)]

	let totalValue = make16(higherPart, lowerPart)
	let newIntValue = totalValue - value
	if (newIntValue < 0) {
		newIntValue = (0x10000 - Math.abs(newIntValue))
	}
	totalValue = lzfill(intToHex(newIntValue), 4)

	sys[name.charAt(0)] = totalValue.slice(0, 2)
	registers[name.charAt(0)].value = lzfill(totalValue.slice(0, 2), 2)
	sys[name.charAt(1)] = totalValue.slice(2, 4)
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

function getRAMcell(x, y) { //both values are on the interval [0, 15]
	return RAMtable.children[0].children[1 + y].children[1 + x]
}

function loadRAMtoTable(requestedCellAddr) {
	requestedCellAddr = requestedCellAddr || null
	if (requestedCellAddr != null) processViewer.scrollBy(0, 999)
	for (let row = 0; row < 16; row++) {
		for (let col = 0; col < 16; col++) {
			let finalAddr = (hexToInt(gotoValue.value.slice(0, 2)) * 256) + (16 * row) + col
			let currentCell = getRAMcell(col, row).children[0]
			if (requestedCellAddr != null && requestedCellAddr == finalAddr) {
				cHighlight = [col, row]
				getRAMcell(col, row).style.backgroundColor = "red"
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
		registers[name].value = sys[name]
	})
	flags.S.value = getBit(sys.F, 7)
	flags.Z.value = getBit(sys.F, 6)
	flags.H.value = getBit(sys.F, 4)
	flags.P.value = getBit(sys.F, 2)
	flags.A.value = getBit(sys.F, 1)
	flags.C.value = getBit(sys.F, 0)
}

function clearRegisters() {
	Object.keys(registers).forEach(r => {
		registers[r].value = "00"
	})
	Object.keys(flags).forEach(f => {
		flags[f].value = "0"
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
}

function clearRAMcellHighlight() {
	getRAMcell(cHighlight[0], cHighlight[1]).style.backgroundColor = "#d3d3d3"
}

window.addEventListener('mousedown', function() {
	clearRAMcellHighlight()
})

var editor = ace.edit("ace-editor")
var Range = ace.require('ace/range').Range

editor.setTheme("ace/theme/monokai")
editor.session.setMode("ace/mode/assembly_x86")

editor.setFontSize(20)

if (localStorage['cont'] != undefined && typeof localStorage['cont'] !== 'undefined') {
	editor.setValue(localStorage['cont'])
	editor.clearSelection()
	editor.focus()
}

document.getElementById("ace-editor").addEventListener('keyup', function(e) {
	let lastLine = editor.session.doc.getLine(editor.getCursorPosition().row - 1)
	if (e.key == "Enter" && lastLine.charAt(lastLine.length-1) == ":") {
		editor.indent()
	}
})

window.addEventListener('keyup', function(e) {
	localStorage['cont'] = editor.getValue()
	if (e.key == "F2") {
		go_button.click()
	} else if (e.key == "F4") {
		step_button.click()
	} else if (e.key == "F8") {
		stop_button.click()
	} else if (e.key == "F9") {
		help_button.click()
	}
})

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

//get flag inputs
var flags = {
	S : document.getElementById("s-flag"),
	Z : document.getElementById("z-flag"),
	H : document.getElementById("h-flag"),
	P : document.getElementById("p-flag"),
	A : document.getElementById("a-flag"),
	C : document.getElementById("c-flag"),
}

const flagBitPositions = {
	S : 7,
	Z : 6,
	H : 4,
	P : 2,
	A : 1,
	C : 0
}

//set up reg/flag fields
Object.keys(registers).forEach((r, i) => {
	makeOverwriteByte(registers[r], i)
	if (r != "F") {
		registers[r].onkeypress = function() {
			sys[r] = hexToInt(this.value)
		}
	} else {
		registers[r].onkeypress = function() {
			let asInt = hexToInt(this.value)
			sys[r] = asInt
			flags.S.value = getBit(asInt, 7)
			flags.Z.value = getBit(asInt, 6)
			flags.H.value = getBit(asInt, 4)
			flags.P.value = getBit(asInt, 2)
			flags.A.value = getBit(asInt, 1)
			flags.C.value = getBit(asInt, 0)
		}
	}
})

Object.keys(flags).forEach((f, i) => {
	makeOverwriteBit(flags[f], i)
	flags[f].onkeypress = function() {
		sys.F = modifyBit(sys.F, flagBitPositions[f], parseInt(this.value))
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