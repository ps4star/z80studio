//config management script
const defaultCfg = {
	"envr" : {
		"jpLimit" : -1,
		"onReadonlyWrite" : "error",
		"readonlyRAM" : [],
		"enablePorts" : true,
		"realtimePorts" : false,
		"audioPortSampleRate" : 11025,
		"autoDownloads" : []
	},
	"ports" : {
		"00" : {
			"type" : "text"
		},
		"01" : {
			"type" : "audio"
		}
	}
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
	parseCfg()
}

function parsePortData(p) {
	let retObj = {}
	Object.keys(p).forEach(prop => {
		let propVal = p[prop]
		retObj[prop] = propVal
	})
	if (!("type" in retObj)) {
		cfgError("No 'type' field specified for a port.")
		return {}
	}
	retObj.cBuffer = []
	return retObj
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
		"jpLimit" : checkProp("envr.jpLimit"),
		"onReadonlyWrite" : checkProp("envr.onReadonlyWrite"),
		"forbiddenRAM" : checkProp("envr.readonlyRAM"),
		"enablePorts" : checkProp("envr.enablePorts"),
		"realtimePorts" : checkProp("envr.realtimePorts"),
		"audioPortSampleRate" : checkProp("envr.audioPortSampleRate"),
		"autoDownloads" : checkProp("envr.autoDownloads")
	}

	//gets ports fields
	Object.keys(rawCfg.ports).forEach(port => {
		currentSysPorts[port] = parsePortData(rawCfg.ports[port])
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
		audioCtx = new AudioContext({sampleRate: cfg.envr.audioPortSampleRate*2})

		//plays audio from buffer

		let frameCount = portData.cBuffer.length
		let audioBuffer = audioCtx.createBuffer(1, frameCount, audioCtx.sampleRate)

		let channelData = audioBuffer.getChannelData(0)

		let i = 0
		while (i < frameCount) {
			if (i % 2 == 0)
				channelData[i] = (portData.cBuffer[i] - 127.5) / 127.5
			i++
		}

		let src = audioCtx.createBufferSource()

		src.buffer = audioBuffer
		src.connect(audioCtx.destination)
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
	let portType = portData.type

	sys.ports[portName].cBuffer.push(byte)

	//may dump buffers now if realtimePorts is enabled
	if (cfg.envr.realtimePorts) {
		if (portType == "audio") {
			if (sys.ports[portName].cBuffer.length > portData.bufferSize) {
				dumpPortBuffer(portName)
			}
		}
	}
}

setCfg(localStorage['cfg'] || defaultCfg)