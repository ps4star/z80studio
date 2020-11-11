String.prototype.replaceSeries = function(arr) {
	let res = this
	while (arr.length > 0) {
		let cdata = arr.shift()
		res = res.replace(new RegExp(cdata[0], "g"), cdata[1])
	}
	return res
}

function removeHexMarkers(s) {
	let idx = 0
	let cTok = ""
	let wasHex = false
	let res = ""
	if (s.split(" ").length == 1 || s.split(" ")[0] == "rst") return s
	while(idx < s.length) {
		let cChar = s.charAt(idx)
		if (cChar == "h" && wasHex) {
			idx++
			continue
		}
		if (legalByteKeys.indexOf(cChar.toUpperCase()) > -1) {
			wasHex = true
		} else {
			wasHex = false
		}
		res += cChar
		idx++
	}
	return res
}

var parseState = {}

function doConversions(s) {
	//does conversions such as %binstring -> $hexstring
	//binstring to hexstring conversion
	let binstringPattern = "\%[0-1]{8}"
	let ci = s.search(binstringPattern)
	while(ci > -1) {
		s = s.slice(0, ci) + lzfill(intToHex(parseInt(s.slice(ci + 1, ci + 9), 2)) + s.slice(ci + 9), 2).toUpperCase() + "h"
		ci = s.search(binstringPattern)
	}
	return s
}

function initParser() {
	clearSys()
	let documentData = editor.getValue() //gets editor data as string
	documentData = doConversions(documentData)
	parseState.lines = documentData.replaceSeries([[" {4}", "\t"], ["\t", ""], ["\r\n", "\n"], ["\n+", "\n"]]).split("\n")
	parseState.ln = 0
	parseState.sym = {}
	parseState.totalProgramBytes = 0
	parseState.cLoadAddr = 0
}

const firstPassOps = [".define"]

function calcRelJump(dest, source) {
	let diff = dest - source
	if (diff > 255) {
		exitWith("Difference between relative jump instruction location (line "+(parseState.ln+1)+") and desired jump location exceeds int8 limit (either too far back or too far forwards).")
	}
	if (diff < 0) {
		diff = (256 - Math.abs(diff))
	}
	return diff
}

function derefLn(ln, rel) {
	rel = rel || false
	let toAnalyze = ln
	Object.keys(parseState.sym).forEach(s => {
		if (!ln.includes(s)) return
		if (!rel) {
			toAnalyze = toAnalyze.replace(s, lzfill(parseState.sym[s].byteLocation.toString(16), parseState.sym[s].strlen)+"h")
		} else {
			toAnalyze = toAnalyze.replace(s, lzfill(calcRelJump(parseState.sym[s].byteLocation, parseState.cLoadAddr).toString(16), 2)+"h")
		}
	})
	return toAnalyze
}

const relJumpIns = [
	"jr",
	"dj"
]

function countBytes(ln) {
	let newln = ln.split(" ")[0] + " " + ln.split(" ").slice(1).join("")
	if (ln.split(" ").length == 1) {
		newln = ln
	}
	let retObj = ""
	let rel = false
	if (relJumpIns.indexOf(ln.slice(0, 2)) > -1) {
		rel = true
	}
	newln = derefLn(newln, rel)
	let INSkeys = Object.keys(INS)
	console.log(newln)
	for (let i = 0; i < INSkeys.length; i++) {
		//console.log(removeHexMarkers(newln).replace("$", ""))
		let s = INSkeys[i]
		if (new RegExp(s.replace(/\*/g, "[0-9a-fA-F]{2}")).test(removeHexMarkers(newln).replace("$", ""))) {
			retObj = INS[s][0]
			break
		}
	}
	return retObj
}

function bufferRAM(byte) {
	//adds byte to RAM and increments parseState.cLoadAddr
	sys.RAM[parseState.cLoadAddr] = parseInt(byte, 16)
	parseState.cLoadAddr++
}

function grabSymbols() {
	//1st pass: gets label names

	let cbyte = 0

	parseState.lines.forEach((line, idx) => {

		if (line.length == 0 || (line.split(" ").length == 1 && !line.includes(":"))) return

		//gets args and checks if op needs to be handled by 1st pass
		let args = line.split(" ")
		let op = args[0]

		let byteCountAttempt = countBytes(line)
		if (byteCountAttempt != "") {
			cbyte += byteCountAttempt
			return
		}

		//op is now guaranteed to be a 1st-pass op
		switch (op) {
			case ".define":
				break
			default:
				//label case
				let lbl = line.slice(0, line.length - 1) //gets everything but the ':'
				parseState.sym[lbl] = {byteLocation: cbyte, ln: idx, strlen: 4}
				break
		}
	})

	parseState.totalProgramBytes = cbyte
}

function getHexFromLine(l) {
	let hxd = ""
	if (l.indexOf("$") > -1) {
		let s = l.indexOf("$") + 1
		while (l.charAt(s) != "," && s < l.length) {
			hxd += l.charAt(s)
			s++
		}
	} else if (l.indexOf("h") > -1) {
		let ind = l.indexOf("h")
		let s = l.charAt(ind - 1)
		if (legalByteKeys.indexOf(l.charAt(ind - 3)) > -1) {
			hxd += l.slice(ind - 4, ind - 2)
		}
		if (legalByteKeys.indexOf(s) > -1) {
			hxd += l.slice(ind - 2, ind)
		}
	}
	return hxd
}

function bufferLineToRAM(line) {
	let sanitizedLine = line.replaceSeries([[", ", ","], [" +", " "]])

	sanitizedLine = derefLn(sanitizedLine)

	let hxd = getHexFromLine(sanitizedLine)

	let op = 0
	Object.keys(INS).forEach(i => {
		if (new RegExp(i.replace(/\*\*/, "[0-9a-fA-F]{4}").replace(/\*/, "[0-9a-fA-F]{2}")).test(removeHexMarkers(sanitizedLine).replace(/\$/g, ""))) {

			let temp = parseState.cLoadAddr

			//op
			for (var k = 1; k < INS[i].length; k++) {
				bufferRAM(intToHex(INS[i][k]))
			}
			if (hxd.length >= 2) {
				//p1
				bufferRAM(hxd.slice(0, 2))
				if (hxd.length == 4) {
					//p2
					bufferRAM(hxd.slice(2, 4))
				}
			}

			//checks if instruction was formed correctly
			if ( (parseState.cLoadAddr - temp) != (INS[i][0] + INS[i].length - 2)) {
				//if specified instruction size is incongruent with actual bytes dumped...
				exitWith("Instruction at line " + (parseState.ln + 1) + " is defined as taking " + INS[i][0] + " bytes, but was formed with " + (parseState.cLoadAddr - temp) +". Remember to use $xx or xxh for immediate hex values.")
			}
		}
	})
}

function assemble() {
	parseState.lines.forEach(l => {
		if (l.length == 0) return
		bufferLineToRAM(l)
	})
	loadRAMtoTable()
	clearRAMcellHighlight()
}

function parseLnStep() {
	while (parseState.lines[parseState.ln].charAt(parseState.lines[parseState.ln].length-1) == ":" || parseState.lines[parseState.ln] == "") {
		parseState.ln++
		if (parseState.ln >= parseState.lines.length) {
			return null
		}
	}
	clearMarkers()
	editor.session.addMarker(new Range(parseState.ln, 0, parseState.ln, 1), "stepHL", "fullLine")

	//runs exec
	let eResult = exec()

	if (eResult.isJump) {
		let newln = 0
		Object.keys(parseState.sym).forEach(s => {
			if (parseState.lines[parseState.ln].includes(s)) {
				parseState.ln = parseState.sym[s].ln
			}
		})
	} else {
		parseState.ln++
	}

	return 0 //OK
}

function parseDocument() {
	initParser()
	grabSymbols()
	assemble()

	while (getPC() < parseState.totalProgramBytes) {
		exec()
	}

	resetAll()
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
}

function exitWith(errMsg) {
	resetAll()
	alert(errMsg)
}

var goButton = document.getElementById("go-button")
var stepButton = document.getElementById("step-button")
var stopButton = document.getElementById("stop-button")

//binds functions to each button
goButton.onclick = () => {
	parseDocument()
}

stepButton.onclick = () => {

	editor.setReadOnly(true)

	if (Object.keys(parseState).length < 1) {
		initParser()
		grabSymbols()
		assemble()
	}

	if (parseState.ln >= parseState.lines.length) {
		stopButton.click()
		return
	}

	if (parseLnStep() == null) {
		resetAll()
		return
	}

}

stopButton.onclick = () => {
	resetAll()
	clearSys()
	editor.setReadOnly(false)
}