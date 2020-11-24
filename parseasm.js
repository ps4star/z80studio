String.prototype.replaceSeries = function(arr) {
	let res = this
	while (arr.length > 0) {
		let cdata = arr.shift()
		res = res.replace(new RegExp(cdata[0], "g"), cdata[1])
	}
	return res
}


var parseState = {}

function doConversions(s) {
	return s.replace(/\/\*.+\*\//g, "").replace(/ {4}/g, "\t").replace(/\t/g, "").replace(/ +$/g, "").replace(/\r\n/g, "\n").replace(/^ +/g, "")
}

function initParser(dt, mode) {
	up.value = ""
	mode = mode || false
	clearSys()
	let documentData = dt
	parseState.lines = doConversions(documentData).split("\n")
	parseState.lines.push("")
	parseState.derefedLines = []
	parseState.ln = 0
	parseState.primitiveSym = []
	parseState.vars = {}
	parseState.sym = {}
	parseState.mode = mode
	parseState.totalProgramBytes = 0
	parseState.cLoadAddr = 0
	parseState.cParseAddr = 0
}

var outputBuffer = []
var coff = 0

var callbackFunc = []

function bufferByte(byte) {
	outputBuffer.push(byte)
	parseState.cLoadAddr++
}

function bufferByteArray(arr) {
	arr.forEach(byte => {
		byte = parseInt(byte, 16)
		outputBuffer.push(byte)
		parseState.cLoadAddr++
	})
}

function bufferRawByteArray(arr) {
	arr.forEach(byte => {
		outputBuffer.push(byte)
		parseState.cLoadAddr++
	})
}

function insertByteToBuffer(byte, pos) {
	outputBuffer.splice(pos+1, 0, byte)
}

function writeBufferByte(byte, pos) {
	outputBuffer[pos] = byte
}

function writeBufferToRAM() {
	//writes each byte in buffer to RAM
	outputBuffer.forEach((byte, idx) => {
		sys.RAM[idx] = byte
	})

	loadRAMtoTable(null, parseState.mode)

	//clears buffer
	outputBuffer = []
}

var bytePositions = {}

let isRawDiff = false

function extractStrFromLine(l) {
	let nameSection = l.split(" ").slice(1).join(" ")
	let fname = null
	let c = 1
	while (c < nameSection.length) {
		let char = nameSection[c].replace('"', "'")
		if (char == "'") {
			break
		}
		fname += char
		c++
	}
	return fname
}

function grabSymbols() {
	//de-ref incs
	for (let i = 0; i < parseState.lines.length; i++) {
		let line = parseState.lines[i]
		if (line.split(" ")[0].toLowerCase() == ".inc") {
			if (nameSection.charAt(0).replace('"', "'") == "'") {
				let fname = extractStrFromLine(line)

				if (Object.keys(cFiles).indexOf(fname) > -1) {
					parseState.lines[i] = ""
					parseState.lines.splice(i, 0, doConversions(cFiles[fname]).split("\n"))
					parseState.lines = parseState.lines.flat()
				} else {
					exitWith("Unknown file " + fname + ". Did you import it in the Files menu?")
				}

			} else {
				exitWith(".inc syntax error. Must use quotation marks around file name.")
				return
			}
		} else if (line.split(" ")[0].toLowerCase() == ".template") {
			if (nameSection.charAt(0).replace('"', "'") == "'") {
				let fname = extractStrFromLine(line)

				if (Object.keys(templates).indexOf(fname) > -1) {
					parseState.lines[i] = ""
					parseState.lines.splice(i, 0, templates[fname].split("\n"))
					parseState.lines = parseState.lines.flat()
				} else {
					exitWith("Unknown template " + fname + ".")
				}

			} else {
				exitWith(".template syntax error. Must use quotation marks around template name.")
				return
			}
		} else if (line.split(" ")[0].toLowerCase() == ".binc" || line.split(" ")[0].toLowerCase() == ".incbin") {
			//includes binary data
		}
	}

	console.log(parseState.lines)

	parseState.lines.forEach((line, idx) => {
		if (line.length == 0) return
		if (line[line.length-1] == ":") {
			parseState.primitiveSym.push(line.slice(0, line.length-1))
		} else if (line.split(" ")[0].toLowerCase() == ".define") {
			parseState.vars[line.split(" ")[1]] = line.split(" ")[2]
			parseState.lines[idx] = ""
		} else if (line.split(" ")[0].toLowerCase() == ".cfg") {
			if (line.split(" ").length < 3) {
				exitWith("Invalid .cfg statement on line " + idx + ". Too few arguments given. Example usage: .cfg envr.audioPortSampleRate 22050")
			}
			let property = line.split(" ")[1]
			let newValue = line.split(" ").slice(2).join(" ")

			modifyCfgComponent(property, newValue)
			isRawDiff = true

			parseState.lines[idx] = ""
		}
	})
}

function calcRel(origin, destination) {
	if (origin > destination) {
		return (0x100 - (origin - destination))
	} else {
		return (destination - origin)
	}
}

function parse() {
	//STEP 1: literally just make a list of symbols (+ delete .define statements)
	bytePositions = {}

	//STEP 2: parse
	parseState.lines.forEach((line, idx) => {
		if (line.length == 0) return
		//removes all comments
		line = line.replace(/ +$/, "")
		if (line.split(" ")[0].toLowerCase() == ".db") {
			let args = line.split(" ")
			if (args[1].charAt(0) == "\"" || args[1].charAt(0) == "'") {
				//str
				let noStrLn = line.replace(/'/g, "\"")
				let noStrArgs = noStrLn.split(" ")
				let onlyString = noStrArgs.slice(1).join(" ")
				let c = 0
				let finalDt = ""
				let state = "none"
				while (c < onlyString.length) {
					if (state == "ignore") {
						finalDt += onlyString.charAt(c)
						state = "main"
						c++
						continue
					}
					if (onlyString.charAt(c) == "\"" && state == "none") {
						state = "main"
					} else if (state == "main") {
						if (onlyString.charAt(c) == "\\") {
							state = "ignore"
							c++
							continue
						}
						if (onlyString.charAt(c) == "\"") {
							break
						} else {
							finalDt += onlyString.charAt(c)
						}
					}
					if (onlyString.charAt(c) != "\"" && c == onlyString.length) {
						exitWith(".db <string> must end with a quotation mark. Error on line " + line)
					}
					c++
				}
				bufferRawByteArray(stringToASCII(finalDt))

				//terminator
				bufferByte(0)
			} else {
				//is not string, but series of bytes instead
				let res = line.split(" ").slice(1).join(" ").replace(/ +/g, ",").replace(/h/g, "").replace(/\$/g, "").split(",").filter(el => {
					return el.length > 0
				})
				bufferByteArray(res)
			}
			return
		}
		line = line.replace(/\/\/.+/g, "").replace(/;.+/g, "")
		//rep .define constants
		Object.keys(parseState.vars).forEach(v => {
			line = line.replace(v, parseState.vars[v])
		})

		let noSpaceLine = line.indexOf(" ") > -1 ? line.split(" ")[0] + " " + line.split(" ").slice(1).join(" ").replace(/ +/g, "") : line.replace(/ +/g, "")
		
		//rep syms
		let strucLn = noSpaceLine.replace(/[a-fA-F0-9]{3,4}h/g, "**").replace(/\$[a-fA-F0-9]{3,4}/g, "**").replace(/[a-fA-F0-9]{2}h/g, "*").replace(/\$[a-fA-F0-9]{2}/g, "*")

		//resolve symbols
		parseState.primitiveSym.forEach(sym => {
			if (strucLn.charAt(strucLn.length - 1) == ":") {
				return
			}
			if (strucLn.split(" ")[0].toLowerCase() == "jr" || strucLn.split(" ")[0].toLowerCase() == "djnz") {
				strucLn = strucLn.replace(sym, "*")
			} else {
				strucLn = strucLn.replace(sym, "**")
			}
		})

		//strucLn now contains template instruction data
		//if it's a label
		if (noSpaceLine.charAt(noSpaceLine.length - 1) == ":") {
			let symName = noSpaceLine.slice(0, noSpaceLine.length - 1)
			parseState.sym[symName] = {}
			parseState.sym[symName].byteLocation = parseState.cLoadAddr
			parseState.sym[symName].ln = idx
			return
		}

		bytePositions[idx] = parseState.cLoadAddr

		let bytes = []

		let p1 = undefined
		let p2 = undefined

		let numParams = (strucLn.match(/\*/g) || []).length

		//now that we know it's an INS, we need to get params if any exist
		if (strucLn.indexOf("*") > -1) {
			//there exist 1 or more params
			let off = 0
			for (let charID = 0; charID < strucLn.length; charID++) {
				let cChar = strucLn[charID]
				if (cChar == "*") {
					let dt = parseInt(noSpaceLine.slice(charID+off, charID+off + 2), 16)
					if (Number.isNaN(dt)) {
						dt = parseInt(noSpaceLine.slice(charID+off + 1, charID+off + 3), 16)
						console.log(strucLn)
						console.log(noSpaceLine.slice(charID+off + 1, charID+off + 3))
					}
					if (Number.isNaN(dt)) {
						continue
					}
					bytes.push(dt)
					off += 2
					continue
				}
			}
		}

		if (bytes.length > 0) {
			p1 = bytes[0]
		}

		if (bytes.length > 1) {
			p2 = bytes[1]
		}

		//p1 and p2 are initialized!

		//if it's an INS
		let indexOfINS = Object.keys(INS).indexOf(strucLn)
		if (indexOfINS > -1) {
			let cIns = INS[Object.keys(INS)[indexOfINS]]
			//indexOfINS = index
			//cIns       = ins data
			//cIns[0]    = length
			//cIns[1:]   = byte data

			//std. all ins have this
			bufferByte(cIns[1])

			if (cIns.length > 2) {
				bufferByte(cIns[2])
			}

			if (cIns.length > 3) {
				//[XXCB]**XX
				bufferByte(p1)
				bufferByte(cIns[3])
			} else {
				if (numParams > 0) {
					bufferByte(p1 || 0)
				}

				numParams--

				if (numParams > 0) {
					bufferByte(p2 || 0)
				}
			}
		}

	})

	let testO = []

	outputBuffer.forEach(b => {
		testO.push(lzfill(b.toString(16), 2).toUpperCase())
	})

	//STEP 3: resolve symbols and fix output byte buffer accordingly
	parseState.lines.forEach((line, idx) => {
		if (line.length == 0 || line.split(" ")[0].toLowerCase() == ".db" || line.replace(/ +/g, "").charAt(line.replace(/ +/g, "").length - 1) == ":") return
		let newln = line
		let newbyte = 0
		Object.keys(parseState.sym).forEach(sym => {
			if (newln != line) return
			newbyte = parseState.sym[sym].byteLocation
			newln = line.replace(sym, newbyte)
		})
		if (newln != line) {
			//changed
			let thisLinePosition = bytePositions[idx]
			let arg0 = newln.split(" ")[0].toLowerCase()
			if (arg0 == "jr" || arg0 == "djnz") {
				newbyte = (newbyte) % 256
				writeBufferByte(calcRel(thisLinePosition, newbyte), thisLinePosition + 1)
			} else {
				newbyte = (newbyte) % 65536
				writeBufferByte(Math.floor(newbyte / 256), thisLinePosition + 1)
				writeBufferByte(newbyte % 256, thisLinePosition + 2)
			}
		}
	})

	parseState.totalProgramBytes = outputBuffer.length

	//STEP 4: finalize buffer by writing it to RAM
	writeBufferToRAM()
}

function assemble() {
	loadRAMtoTable()
	clearRAMcellHighlight()
}

function parseLnStep() {

	while (parseState.lines[parseState.ln].includes(":") || parseState.lines[parseState.ln].replace(/^;.+$/g, "") == "") {
		parseState.ln++
		if (parseState.ln >= parseState.lines.length) {
			return null
		}
	}

	if (getPC() >= parseState.totalProgramBytes) return null

	clearMarkers()
	editor.session.addMarker(new Range(parseState.ln, 0, parseState.ln, 1), "stepHL", "fullLine")

	let cPC = lzfill(intToHex(getPC()), 4)

	highlightCell((parseInt(cPC.slice(2, 4), 16) % 16), Math.floor(parseInt(cPC.slice(2, 4), 16) / 16))

	//runs exec
	for (let i = 0; i < cfg.envr.stepIncrement; i++) {
		let eResult = exec()

		if (eResult.isJump) {
			let run = true
			Object.keys(bytePositions).forEach(bytePos => {
				if (!run) return
				let cbyte = bytePositions[bytePos]
				if (getPC() == cbyte) {
					parseState.ln = parseInt(bytePos)
					run = false
				}
			})
		} else {
			parseState.ln++
		}
	}

	return 0 //OK
}

function parseDocument(s) {

	if (isFirstExec) {
		s = s || editor.getValue()
		initParser(s, false)
		grabSymbols()
		parseCfg()
		if (parseState.isUpload) {
			document.body.onfocus = () => {
				isFirstExec = false
				callbackFunc = [
					"parseDocument",
					s
				]
			}
			return
		} else {
			isFirstExec = false
		}
	} else {
		document.body.onfocus = () => {}
	}

	parse()
	assemble()

	console.time('execTime')

	while (getPC() < parseState.totalProgramBytes) {
		exec()
	}

	console.timeEnd('execTime')

	isFirstExec = true

	dumpAllPortBuffers()

	clearCfg()

	editor.setReadOnly(false)
}

function clearMarkers() {
	let markers = editor.session.getMarkers(false)
	Object.keys(markers).forEach(m => {
		if (m >= 3) {
			editor.session.removeMarker(m)
		}
	})
}

function resetAll() {
	parseState = {}
	clearMarkers()
	coff = 0
}

function exitWith(errMsg) {
	resetAll()
	alert(errMsg)
	clearSys()
	clearRAMcellHighlight()
	editor.setReadOnly(false)
}

var goButton = document.getElementById("go-button")
var stepButton = document.getElementById("step-button")
var stopButton = document.getElementById("stop-button")

let isFirstExec = true

//binds functions to each button
goButton.onclick = () => {

	editor.setReadOnly(true)

	initCfg()

	parseDocument()

	updateRegisters()

	sys.SP[0] = 65535
	registers16.SP.value = "FFFF"

	editor.setReadOnly(false)
}

let flag

stepButton.onclick = () => {

	editor.setReadOnly(true)

	if (isFirstExec) {
		flag = true
		initCfg()
		initParser(editor.getValue(), true)
		grabSymbols()
		parseCfg()
		if (parseState.isUpload) {
			document.body.onfocus = () => {
				isFirstExec = false
				callbackFunc = [
					"click-step"
				]
			}
			return
		} else {
			isFirstExec = false
		}
	} else {
		document.body.onfocus = () => {}
	}

	if (flag) {
		parse()
		assemble()
	}

	flag = false

	if (parseState.ln >= parseState.lines.length) {
		stopButton.click()
		return
	}

	if (parseLnStep() == null) {
		stopButton.click()
		return
	}

}

stopButton.onclick = () => {
	clearRAMcellHighlight()
	resetAll()
	clearSys()

	isFirstExec = true

	dumpAllPortBuffers()

	clearCfg()

	editor.setReadOnly(false)
}