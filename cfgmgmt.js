//config management script
const defaultCfg = {
	"envr" : {
		"stepIncrement" : 1,
		"enablePorts" : true,
		"realtimePorts" : false
	},
	"ports" : {}
}

var rawCfg = {}
var cfg = {}

function cfgError(errMsg) {
	alert("INVALID CONFIG: " + errMsg)
	rawCfg = {}
	cfg = {}
}

function checkProp(p) {
	let pParts = p.split(".")
	let cObj = rawCfg
	pParts.forEach(part => {
		if (cObj[part] == undefined) {
			cfgError("Missing one or more required properties.")
			return
		}
		cObj = cObj[part]
	})
	return cObj
}

function setCfg(newCfg) {
	rawCfg = newCfg
	localStorage['cfg'] = JSON.stringify(newCfg)
}

function parsePortData(name, p) {
	let retObj = {}
	Object.keys(p).forEach(prop => {
		let propVal = p[prop]
		retObj[prop] = propVal
	})

	if (!("type" in retObj)) {
		cfgError("No 'type' field specified for a port.")
		return {}
	}

	//set onWrite behavior according to type
	if (retObj.type == "flashROM") {
		//readonly
		retObj.onWrite = retObj.onWrite || "ignore"
		retObj.onRead = retObj.onRead || "readnext"

		//sets up cBuffer from src field
		let args = retObj.src.split(":")
		if (args[0].toLowerCase() == "bytearray") {
			let tempBuffer = []
			args[1].split(" ").forEach(byte => {
				tempBuffer.push(parseInt(byte, 16))
			})

			//creates Uint8Array and makes it the cBuffer
			retObj.cBuffer = new Uint8Array(tempBuffer)
			retObj.readPos = 0
		} else if (retObj.src.toLowerCase() == "upload") {
			rfmode = "flashROM"
			up.click()
			modifyBuffer = name

			parseState.isUpload = true

			retObj.readPos = 0
		}
	} else {
		//writeonly
		retObj.onWrite = retObj.onWrite || "push"
		retObj.onRead = retObj.onRead || "ignore"

		//initializes blank buffer
		retObj.cBuffer = []
		retObj.readPos = 0
	}

	return retObj
}

function modifyCfgComponent(component, newValue) {

	let componentParts = component.split(".")

	if (componentParts[0] == "envr") {
		rawCfg.envr[componentParts[1]] = JSON.parse(newValue)
	} else if (componentParts[0] == "ports") {
		if (componentParts.length < 3) exitWith("Too few arguments in port .cfg")
		if (!rawCfg.ports[componentParts[1]]) rawCfg.ports[componentParts[1]] = {}

		let parsedNewValue = newValue

		try {
			parsedNewValue = JSON.parse(newValue)
		} catch(e) {}

		rawCfg.ports[componentParts[1]][componentParts[2]] = parsedNewValue
	} else {
		let asNum = parseInt(componentParts[0], 16)
		if (Number.isNaN(asNum) || asNum < 0 || asNum > 255) {
			exitWith("No such field " + component + " available for configuration.")
			return
		}
		let parsedNewValue = newValue

		try {
			parsedNewValue = JSON.parse(newValue)
		} catch(e) {}

		if (!rawCfg.ports[componentParts[0]]) rawCfg.ports[componentParts[0]] = {}
		rawCfg.ports[componentParts[0]][componentParts[1]] = parsedNewValue
	}
}

var currentSysPorts = {}

function parseCfg() {
	//constructs a proper cfg obj from rawCfg
	//gets top-level fields
	cfg = {
		"envr" : checkProp("envr"),
		"ports" : checkProp("ports")
	}

	//gets envr fields
	cfg.envr = {
		"stepIncrement" : checkProp("envr.stepIncrement"),
		"realtimePorts" : checkProp("envr.realtimePorts"),
		"enablePorts" : checkProp("envr.enablePorts")
	}

	//gets ports fields
	Object.keys(rawCfg.ports).forEach(port => {
		currentSysPorts[port] = parsePortData(port, rawCfg.ports[port])
	})
	
	initPorts()
}

function initPorts() {
	sys.ports = currentSysPorts
}

var AudioContext = window.AudioContext || window.webkitAudioContext
var audioCtx

//port mgmt
function dumpPortBuffer(port) {
	if (!cfg.envr.enablePorts) return
	let portData = sys.ports[port]
	if (portData.cBuffer.length == 0) return
	if (portData.type == "text") {
		alert("Port " + port +" EOE Output: " + String.fromCharCode(...portData.cBuffer))
	} else if (portData.type == "audio") {
		//init obj
		audioCtx = new AudioContext({sampleRate: 88200})
		
		//make volume a bit lower
		let gainNode = audioCtx.createGain()
		gainNode.gain.value = 0.35
		gainNode.connect(audioCtx.destination)

		//plays audio from buffer

		let frameCount = portData.cBuffer.length
		let audioBuffer = audioCtx.createBuffer(1, frameCount, audioCtx.sampleRate)

		let channelData = audioBuffer.getChannelData(0)

		let i = 0
		while (i < frameCount) {
			channelData[i] = (portData.cBuffer[i] - 128) / 128
			i++
		}

		let src = audioCtx.createBufferSource()

		src.buffer = audioBuffer
		src.connect(gainNode)
		src.start()
	}
	sys.ports[port].cBuffer = []
}

function dumpAllPortBuffers() {
	Object.keys(sys.ports).forEach(port => {
		dumpPortBuffer(port)
	})
}

function handlePortWrite(port, byte) {
	let portName = lzfill(port.toString(16), 2)
	let portData = sys.ports[portName]

	if (portData.onWrite == "push")
		sys.ports[portName].cBuffer.push(byte)

	if (cfg.envr.realtimePorts) {
		if (portData.type == "audio") {
			if (portData.cBuffer.length >= portData.bufferSize) {
				dumpPortBuffer(portName)
			}
		}
	}
}
let a = 0
function handlePortRead(port) {
	let portName = lzfill(port.toString(16), 2)
	a++

	if (sys.ports[portName].onRead == "readnext") {
		let res
		res = sys.ports[portName].cBuffer[sys.ports[portName].readPos]
		sys.ports[portName].readPos++
		return res
	} else if (sys.ports[portName].onRead == "ignore") {
		return 0
	} else {
		exitWith("Cannot read from port with unknown read mode " + port + ".")
	}
}

function clearCfg() {
	cfg = {}
	rawCfg = {}
	sys.ports = {}
	currentSysPorts = {}
}

function initCfg() {
	setCfg((typeof localStorage['cfg'] == "undefined") ? defaultCfg : JSON.parse(localStorage['cfg']))
}
