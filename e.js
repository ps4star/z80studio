//RAM execution script
function getPar(n) {
	//gets parity of number
	return ((n.toString(2).match(/1/g) || []).length + 1) % 2
}

function getNextByte() {
	//gets RAM byte pointed to by PC
	return sys.RAM[sys.PC[0]]
}

function getP1() {
	//returns byte after PC
	return sys.RAM[sys.PC[0]+1]
}

function getP2() {
	//returns 2 bytes after PC
	return sys.RAM[sys.PC[0]+2]
}

function getP12() {
	return sys.RAM[sys.PC[0]+1] * 256 + sys.RAM[sys.PC[0]+2]
}

function getP3() {
	//returns 3 bytes after PC (used for 1-byte ext instructions)
	return sys.RAM[sys.PC[0]+3]
}

function getP23() {
	return sys.RAM[sys.PC[0]+2] * 256 + sys.RAM[sys.PC[0]+3]
}

function getP4() {
	//returns 4 bytes after PC (used for 2-byte ext instructions)
	return sys.RAM[sys.PC[0]+4]
}

function getP34() {
	return sys.RAM[sys.PC[0]+3] * 256 + sys.RAM[sys.PC[0]+4]
}

function setPC(n) {
	sys.PC[0] = n
	if (!parseState.mode) return
	registers16.PC.value = lzfill(sys.PC[0].toString(16), 4)
}

function addPC(n) {
	sys.PC[0] += n
	if (!parseState.mode) return
	registers16.PC.value = lzfill(sys.PC[0].toString(16), 4)
}

function subPC(n) {
	sys.PC[0] -= n
	if (!parseState.mode) return
	registers16.PC.value = lzfill(sys.PC[0].toString(16), 4)
}

function incPC() {
	sys.PC[0]++
	if (!parseState.mode) return
	registers16.PC.value = lzfill(sys.PC[0].toString(16), 4)
}

//std flag operation functions
function setStdIncFlags8(n) {
	//overflow/zero
	if (n == 0) {
		//did overflow and is 0
		setPFlag(1)
		setZFlag(1)
	} else {
		//didn't overflow and is not 0
		setPFlag(0)
		setZFlag(0)
	}

	//sign
	if (n >= 128) {
		//is sign bit set
		setSFlag(1)
	} else {
		//is sign bit not set
		setSFlag(0)
	}

	//half-carry
	if ((n-1) % 16 == 15) {
		//bit 4 was set
		setHFlag(1)
	} else {
		//bit 4 was not set
		setHFlag(0)
	}

	//this was not a subtraction
	setNFlag(0)

	//C is unaffected by inc instructions

	updateF()
}

function setStdIncFlags16(n) {
	//overflow/zero
	let isNzero = Number(n == 0)
	setPFlag(isNzero)
	setZFlag(isNzero)

	//sign
	setSFlag(Number(n >= 32768))

	//half-carry
	setHFlag(Number((n-1) % 16 == 15))

	//this was not a subtraction
	setNFlag(0)

	//C is unaffected by inc instructions
	updateF()
}

function setStdDecFlags8(n) {
	//overflow/zero
	if (n == 255) {
		//did overflow
		setPFlag(1)
		setZFlag(0)
	} else if (n == 0) {
		//didn't overflow and is 0
		setPFlag(0)
		setZFlag(1)
	} else {
		//didn't overflow and is not 0
		setPFlag(0)
		setZFlag(0)
	}

	//sign
	if (n >= 128) {
		//is sign bit set
		setSFlag(1)
	} else {
		//is sign bit not set
		setSFlag(0)
	}

	//half-carry
	if ((n+1) % 16 == 15) {
		//bit 4 was set
		setHFlag(1)
	} else {
		//bit 4 was not set
		setHFlag(0)
	}

	//this was a subtraction
	setNFlag(1)

	//C is unaffected by dec instructions
	updateF()
}

function setStdDecFlags16(n) {
	//overflow/zero
	if (n == 65535) {
		//did overflow
		setPFlag(1)
		setZFlag(0)
	} else if (n == 0) {
		//didn't overflow and is 0
		setPFlag(0)
		setZFlag(1)
	} else {
		//didn't overflow and is not 0
		setPFlag(0)
		setZFlag(0)
	}

	//sign
	if (n >= 32768) {
		//is sign bit set
		setSFlag(1)
	} else {
		//is sign bit not set
		setSFlag(0)
	}

	//half-carry
	if ((n+1) % 16 == 15) {
		//bit 4 was set
		setHFlag(1)
	} else {
		//bit 4 was not set
		setHFlag(0)
	}

	//this was a subtraction
	setNFlag(1)

	//C is unaffected by dec instructions
	updateF()
}

function setStdAddFlags8(origin, add) {
	//half-carry
	if ((((origin&0xF) + (add&0xF))&0x10) == 0x10) {
		//half-carry occurred
		setHFlag(1)
	} else {
		//half-carry did not occur
		setHFlag(0)
	}

	//sign
	if (origin + add >= 128) {
		setSFlag(1)
	} else {
		setSFlag(0)
	}

	//carry/overflow
	if (origin + add > 255) {
		setCFlag(1)
		setPFlag(1)
	}

	//zero
	if (origin + add == 0) {
		setZFlag(1)
	} else {
		setZFlag(0)
	}

	//this was not a subtraction
	setNFlag(0)

	updateF()
}

function setStdAddFlags16(origin, add) {
	//half-carry
	if ((((origin&0xF00) + (add&0xF00))&0x1000) == 0x1000) {
		//half-carry occurred
		setHFlag(1)
	} else {
		//half-carry did not occur
		setHFlag(0)
	}

	//carry
	if (origin + add > 65535) {
		setCFlag(1)
	}

	//this was not a subtraction
	setNFlag(0)

	updateF()
}

function setStdSubFlags8(origin, sub) {
	//half-carry
	setHFlag(Number((((origin&0xF) - (sub&0xF))&0x10) == 0x10))

	//carry
	setCFlag(Number(origin - sub < 0))

	//zero
	setZFlag(Number(origin - sub == 0))

	//this was a subtraction
	setNFlag(1)

	updateF()
}

function setStdSubFlags16(origin, sub) {
	//half-carry
	if ((((origin&0xF00) - (sub&0xF00))&0x1000) == 0x1000) {
		//half-carry occurred
		setHFlag(1)
	} else {
		//half-carry did not occur
		setHFlag(0)
	}

	//carry
	if (origin + add > 65535) {
		setCFlag(1)
	}

	//this was a subtraction
	setNFlag(1)

	updateF()
}

function setStdRlFlagsL(oldVal, newVal) {
	//reset N/H
	setNFlag(0)
	setHFlag(0)

	//set C
	setCFlag(Number((newVal&0x80) == 0x80))

	updateF()
}

function setStdRlFlagsR(oldVal, newVal) {
	//reset N/H
	setNFlag(0)
	setHFlag(0)

	//carry
	setCFlag(Number((newVal&0x80) == 0x80))

	updateF()
}

function setStdAndFlags8(newVal) {
	setCFlag(0)
	setNFlag(0)
	setHFlag(1)

	setPFlag(getPar(newVal))

	setZFlag(Number(newVal ==   0))
	setSFlag(Number(newVal >= 128))

	updateF()
}

function setStdOrFlags8(newVal) {
	setCFlag(0)
	setNFlag(0)
	setHFlag(0)

	setPFlag(getPar(newVal))

	setZFlag(Number(newVal ==   0))
	setSFlag(Number(newVal >= 128))

	updateF()
}

function setStdInFlags(newVal) {
	setNFlag(0)
	setHFlag(0)
	setPFlag(getPar(newVal))

	//zero
	setZFlag(Number(newVal == 0))

	//sign
	setSFlag(getBit(newVal, 7))
}

function negA() {
	setStdSubFlags8(0, getA())
	setA((~getA()) + 1)
}

let oldA, oldDE, oldHL, bit0, bit7, cFlag, needed2nd, ptA, ptB, ptC

let eResult = {
	isJump : false
}

const extdTable = [
	//0x40
	() => {
		//in b,(c)
		setB(handlePortRead(getC()))
		setStdInFlags(getB())
		incPC()
	},

	//0x41
	() => {
		//out (c),b
		handlePortWrite(getC(), getB())
		incPC()
	},

	//0x42
	() => {
		//sbc hl,bc
		oldHL = getHL()
		sub16reg("HL", getBC()+getCFlag())
		setStdSubFlags16(oldHL, getBC()+getCFlag())
		incPC()
	},

	//0x43
	() => {
		//ld (**),bc
		setRAM(getP12(), getBC())
		addPC(3)
	},

	//0x44
	() => {
		negA()
		incPC()
	},

	//0x45
	() => {
		incPC()
	},

	//0x46
	() => {
		incPC()
	},

	//0x47
	() => {
		incPC()
	},

	//0x48
	() => {
		//in c,(c)
		setC(handlePortRead(getC()))
		setStdInFlags(getC())
		incPC()
	},

	//0x49
	() => {
		//out (c),c
		handlePortWrite(getC(), getC())
		incPC()
	},

	//0x4A
	() => {
		//adc hl,bc
		oldHL = getHL()
		set16reg("HL", getBC()+getCFlag())
		setStdAddFlags16(oldHL, getBC()+getCFlag())
		incPC()
	},

	//0x4B
	() => {
		//ld bc,(**)
		set16reg("BC", getRAM(getP12()))
		addPC(3)
	},

	//0x4C
	() => {
		negA()
		incPC()
	},

	//0x4D
	() => {
		incPC()
	},

	//0x4E
	() => {
		incPC()
	},

	//0x4F
	() => {
		incPC()
	},

	//0x50
	() => {
		//in d,(c)
		setD(handlePortRead(getC()))
		setStdInFlags(getD())
		incPC()
	},

	//0x51
	() => {
		//out (c),d
		handlePortWrite(getC(), getD())
		incPC()
	},

	//0x52
	() => {
		//sbc hl,de
		oldHL = getHL()
		sub16reg("HL", getDE()+getCFlag())
		setStdSubFlags16(oldHL, getDE()+getCFlag())
		incPC()
	},

	//0x53
	() => {
		//ld (**),de
		setRAM(getP12(), getDE())
		addPC(3)
	},

	//0x54
	() => {
		negA()
		incPC()
	},

	//0x55
	() => {
		incPC()
	},

	//0x56
	() => {
		incPC()
	},

	//0x57
	() => {
		incPC()
	},

	//0x58
	() => {
		//in e,(c)
		setE(handlePortRead(getC()))
		setStdInFlags(getE())
		incPC()
	},

	//0x59
	() => {
		//out (c),e
		handlePortWrite(getC(), getE())
		incPC()
	},

	//0x5A
	() => {
		//adc hl,de
		oldHL = getHL()
		set16reg("HL", getDE()+getCFlag())
		setStdAddFlags16(oldHL, getDE()+getCFlag())
		incPC()
	},

	//0x5B
	() => {
		//ld de,(**)
		set16reg("DE", getRAM(getP12()))
		addPC(3)
	},

	//0x5C
	() => {
		negA()
		incPC()
	},

	//0x5D
	() => {
		incPC()
	},

	//0x5E
	() => {
		incPC()
	},

	//0x5F
	() => {
		//ld a,r
		setA(Math.floor(Math.random() * 256))
	},

	//0x60
	() => {
		//in h,(c)
		setH(handlePortRead(getC()))
		setStdInFlags(getH())
		incPC()
	},

	//0x61
	() => {
		//out (c),h
		handlePortWrite(getC(), getH())
		incPC()
	},

	//0x62
	() => {
		//sbc hl,hl
		oldHL = getHL()
		sub16reg("HL", oldHL+getCFlag())
		setStdSubFlags16(oldHL, oldHL+getCFlag())
		incPC()
	},

	//0x63
	() => {
		//ld (**),hl
		setRAM(getP12(), getHL())
		addPC(3)
	},

	//0x64
	() => {
		negA()
		incPC()
	},

	//0x65
	() => {
		incPC()
	},

	//0x66
	() => {
		incPC()
	},

	//0x67
	() => {
		//rrd
		ptA = (getA()&0xF)
		ptB = (getRAM(getHL())&0xF0)
		ptC = (getRAM(getHL())&0xF)

		setA((getA()&0xF0) + ptC)
		setRAM(getHL(), ptA*16 + ptB)
	},

	//0x68
	() => {
		//in l,(c)
		setL(handlePortRead(getC()))
		setStdInFlags(getL())
		incPC()
	},

	//0x69
	() => {
		//out (c),l
		handlePortWrite(getC(), getL())
		incPC()
	},

	//0x6A
	() => {
		//adc hl,hl
		oldHL = getHL()
		set16reg("HL", oldHL+getCFlag())
		setStdAddFlags16(oldHL, oldHL+getCFlag())
		incPC()
	},

	//0x6B
	() => {
		//ld hl,(**)
		set16reg("HL", getRAM(getP12()))
		addPC(3)
	},

	//0x6C
	() => {
		negA()
		incPC()
	},

	//0x6D
	() => {
		incPC()
	},

	//0x6E
	() => {
		incPC()
	},

	//0x6F
	() => {
		//rld
		ptA = (getA()&0xF)
		ptB = (getRAM(getHL())&0xF0)
		ptC = (getRAM(getHL())&0xF)

		setA((getA()&0xF0) + ptB)
		setRAM(getHL(), ptC*16 + ptA)
	},

	//0x70
	() => {
		//in (c)
		setStdInFlags(handlePortRead(getC()))
		incPC()
	},

	//0x71
	() => {
		//out (c),0
		handlePortWrite(getC(), 0)
		incPC()
	},

	//0x72
	() => {
		//sbc hl,sp
		oldHL = getHL()
		sub16reg("HL", getSP()+getCFlag())
		setStdSubFlags16(oldHL, getSP()+getCFlag())
		incPC()
	},

	//0x73
	() => {
		//ld (**),sp
		setRAM(getP12(), getSP())
		addPC(3)
	},

	//0x74
	() => {
		negA()
		incPC()
	},

	//0x75
	() => {
		incPC()
	},

	//0x76
	() => {
		incPC()
	},

	//0x77
	() => {
		incPC()
	},

	//0x78
	() => {
		//in a,(c)
		setA(handlePortRead(getC()))
		setStdInFlags(getA())
		incPC()
	},

	//0x79
	() => {
		//out (c),a
		handlePortWrite(getC(), getA())
		incPC()
	},

	//0x7A
	() => {
		//adc hl,sp
		oldHL = getHL()
		set16reg("HL", getSP()+getCFlag())
		setStdAddFlags16(oldHL, getSP()+getCFlag())
		incPC()
	},

	//0x7B
	() => {
		//ld sp,(**)
		setSP(getRAM(getP12()))
		addPC(3)
	},

	//0x7C
	() => {
		negA()
		incPC()
	},

	//0x7D
	() => {
		incPC()
	},

	//0x7E
	() => {
		incPC()
	},

	//0x7F
	() => {
		incPC()
	},

	//0x80-0x9F
	null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,
	null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,

	//0xA0
	() => {
		//ldi
		setRAM(getDE(), getRAM(getHL()))
		incHL()
		incDE()
		decBC()
	},

	//0xA1
	() => {
		//cpi
		
	}

]

const execTable = [
	//0x00
	() => {
		incPC()
	},

	//0x01
	() => {
		setB(getP1())
		setC(getP2())
		addPC(3)
	},

	//0x02
	() => {
		setRAM(getRAMatReg("BC"), getA())
		incPC()
	},

	//0x03
	() => {
		add16reg("BC", 0x01)
		setStdIncFlags16(getBC())
		incPC()
	},

	//0x04
	() => {
		addReg("B", 0x01)
		setStdIncFlags(getB())
		incPC()
	},

	//0x05
	() => {
		subReg("B", 0x01)
		setStdDecFlags8(getB())
		incPC()
	},

	//0x06
	() => {
		setB(getP1())
		addPC(2)
	},

	//0x07
	() => {
		setNFlag(0)
		setHFlag(0)

		oldA = getA()

		//stores bit 7 so it can be set to bit 0 later
		bit7 = getBit(getA(), 7)
		setCFlag(bit7)

		//performs left bitshift on A
		addReg("A", getA())
		setA(modifyBit(getA(), 0, bit7))
		setStdRlFlagsL(oldA, getA())
		incPC()
	},

	//0x08
	() => {
		swapSingleShad("A")
		swapSingleShad("F")
		incPC()
	},

	//0x09
	() => {
		oldHL = getHL()
		add16reg("HL", getBC())
		setStdAddFlags16(oldHL, getBC())
		incPC()
	},

	//0x0A
	() => {
		setA(getRAMatReg("BC"))
		incPC()
	},

	//0x0B
	() => {
		sub16reg("BC", 0x01)
		setStdDecFlags16(getBC())
		incPC()
	},

	//0x0C
	() => {
		addReg("C", 0x01)
		setStdIncFlags8(getC())
		incPC()
	},

	//0x0D
	() => {
		subReg("C", 0x01)
		setStdDecFlags8(getC())
		incPC()
	},

	//0x0E
	() => {
		setC(getP1())
		addPC(2)
	},

	//0x0F
	() => {
		setNFlag(0)
		setHFlag(0)

		oldA = getA()

		//stores bit 0 so it can be set to bit 7 later
		bit0 = getBit(oldA, 0)
		setCFlag(bit0)

		//performs right bitshift on A
		setA(bit0*0x80 + Math.floor(getA()/2))

		setStdRlFlagsR(oldA, getA())
		incPC()
	},

	//0x10
	() => {
		subReg("B", 0x01)
		if (getB() != 0) {
			addPC(handleSignedUint8(getP1()))
		} else {
			addPC(2)
		}
	},

	//0x11
	() => {
		set16reg("DE", getP12())
		addPC(3)
	},

	//0x12
	() => {
		setRAM(getDE(), getA())
		incPC()
	},

	//0x13
	() => {
		add16reg("DE", 0x01)
		setStdIncFlags16(getDE())
		incPC()
	},

	//0x14
	() => {
		addReg("D", 0x01)
		setStdIncFlags8(getD())
		incPC()
	},

	//0x15
	() => {
		subReg("D", 0x01)
		setStdDecFlags8(getD())
		incPC()
	},

	//0x16
	() => {
		setD(getP1())
		addPC(2)
	},

	//0x17
	() => {
		setNFlag(0)
		setHFlag(0)

		oldA = getA()

		bit7 = getBit(oldA, 7)
		cFlag = getCFlag()
		setCFlag(bit7)

		addReg("A", getA())
		setA(modifyBit(getA(), 0, bit7))
		setStdRlFlagsL(oldA, getA())
		incPC()
	},

	//0x18
	() => {
		addPC(handleSignedUint8(getP1()))
		eResult.isJump = true
	},

	//0x19
	() => {
		oldHL = getHL()
		add16reg("HL", getDE())
		setStdAddFlags16(oldHL, getDE())
		incPC()
	},

	//0x1A
	() => {
		setA(getRAMatReg("DE"))
		incPC()
	},

	//0x1B
	() => {
		sub16reg("DE", 0x01)
		setStdDecFlags16(getDE())
		incPC()
	},

	//0x1C
	() => {
		addReg("E", 0x01)
		setStdIncFlags8(getE())
		incPC()
	},

	//0x1D
	() => {
		subReg("E", 0x01)
		setStdDecFlags8(getE())
		incPC()
	},

	//0x1E
	() => {
		setE(getP1())
		addPC(2)
	},

	//0x1F
	() => {
		setHFlag(0)
		setNFlag(0)

		oldA = getA()

		bit0 = getBit(oldA, 0)
		cFlag = getCFlag()
		setCFlag(bit0)

		setA(cFlag*0x80 + Math.floor(getA()/2))

		setStdRlFlagsR(oldA, getA())
		incPC()
	},

	//0x20
	() => {
		if (!getZFlag()) {
			addPC(getP1())
			eResult.isJump = true
		} else {
			addPC(2)
		}
	},

	//0x21
	() => {
		set16reg("HL", getP12())
		addPC(3)

	},

	//0x22
	() => {
		setRAM(getP12(), getHL())
		addPC(3)
	},

	//0x23
	() => {
		incHL()
		setStdIncFlags16(getHL())
		incPC()
	},

	//0x24
	() => {
		addReg("H", 0x01)
		setStdIncFlags8(getH())
		incPC()
	},

	//0x25
	() => {
		subReg("H", 0x01)
		setStdDecFlags8(getH())
		incPC()
	},

	//0x26
	() => {
		setH(getP1())
		addPC(2)
	},

	//0x27
	() => {
		//daa

		//if H is set OR lower 4 bits > 9
		if (getHFlag() == 1 || (getA()&0xF) > 9) {
			//add $06 to a
			addReg("A", 0x6)
			setHFlag(1)
		}

		needed2nd = false

		//if C is set OR higher 4 bits > 9
		if (getCFlag() == 1 || (getA()&0xF0) > 9) {
			//add $60 to a
			addReg("A", 0x60)
			needed2nd = true
		}

		//adjust for if N is set
		subReg("A", parseInt(6 * getNFlag() * Math.floor(getA() / 10)))

		//now analyze final result (A) and set flags
		if (needed2nd) {
			setCFlag(1)
		} else {
			setCFlag(0)
		}

		incPC()
	},

	//0x28
	() => {
		if (getZFlag()) {
			addPC(handleSignedUint8(getP1()))
			eResult.isJump = true
		} else {
			addPC(2)
		}
	},

	//0x29
	() => {
		oldHL = getHL()
		add16reg("HL", oldHL)
		setStdAddFlags16(oldHL, oldHL)
		incPC()
	},

	//0x2A
	() => {
		set16reg("HL", getP12())
		addPC(3)
	},

	//0x2B
	() => {
		sub16reg("HL", 0x01)
		setStdDecFlags16(getHL())
		incPC()
	},

	//0x2C
	() => {
		addReg("L", 0x01)
		setStdIncFlags8(getL())
		incPC()
	},

	//0x2D
	() => {
		subReg("L", 0x01)
		setStdDecFlags8(getL())
		incPC()
	},

	//0x2E
	() => {
		setL(getP1())
		addPC(2)
	},

	//0x2F
	() => {
		setA(inv8bit(getA()))
		setNFlag(1)
		setHFlag(1)
		incPC()
	},

	//0x30
	() => {
		if (!getCFlag()) {
			addPC(handleSignedUint8(getP1()))
			eResult.isJump = true
		} else {
			addPC(2)
		}
	},

	//0x31
	() => {
		setSP(getP12())
		addPC(3)
	},

	//0x32
	() => {
		setRAM(getP12(), getA())
		addPC(3)
	},

	//0x33
	() => {
		addSP(0x01)
		incPC()
	},

	//0x34
	() => {
		addRAM(getHL(), 0x01)
		setStdIncFlags16(getRAMatHL())
		incPC()
	},

	//0x35
	() => {
		subRAM(getHL(), 0x01)
		setStdDecFlags16(getRAMatHL())
		incPC()
	},

	//0x36
	() => {
		setRAM(getHL(), getP1())
		addPC(2)
	},

	//0x37
	() => {
		setCFlag(1)
		setNFlag(0)
		setHFlag(0)
		incPC()
	},

	//0x38
	() => {
		if (getCFlag()) {
			addPC(handleSignedUint8(getP1()))
			eResult.isJump = true
		} else {
			addPC(2)
		}
	},

	//0x39
	() => {
		oldHL = getHL()
		add16reg("HL", getSP())
		setStdAddFlags16(oldHL, getSP())
		incPC()
	},

	//0x3A
	() => {
		setA(getRAM(getP12()))
		addPC(3)
	},

	//0x3B
	() => {
		subSP(0x01)
		setStdDecFlags16(getSP())
		incPC()
	},

	//0x3C
	() => {
		incA()
		setStdIncFlags8(getA())
		incPC()
	},

	//0x3D
	() => {
		subReg("A", 0x01)
		setStdDecFlags8(getA())
		incPC()
	},

	//0x3E
	() => {
		setA(getP1())
		addPC(2)
	},

	//0x3F
	() => {
		setNFlag(0)
		setCFlag(!getCFlag() ? 1 : 0)
		setHFlag(getCFlag())
		incPC()
	},

	//0x40
	() => {
		incPC()
	},

	//0x41
	() => {
		setB(getC())
		incPC()
	},

	//0x42
	() => {
		setB(getD())
		incPC()
	},

	//0x43
	() => {
		setB(getE())
		incPC()
	},

	//0x44
	() => {
		setB(getH())
		incPC()
	},

	//0x45
	() => {
		setB(getL())
		incPC()
	},

	//0x46
	() => {
		setB(getRAMatHL())
		incPC()
	},

	//0x47
	() => {
		setB(getA())
		incPC()
	},

	//0x48
	() => {
		setC(getB())
		incPC()
	},

	//0x49
	() => {
		incPC()
	},

	//0x4A
	() => {
		setC(getD())
		incPC()
	},

	//0x4B
	() => {
		setC(getE())
		incPC()
	},

	//0x4C
	() => {
		setC(getH())
		incPC()
	},

	//0x4D
	() => {
		setC(getL())
		incPC()
	},

	//0x4E
	() => {
		setC(getRAMatHL())
		incPC()
	},

	//0x4F
	() => {
		setC(getA())
		incPC()
	},

	//0x50
	() => {
		setD(getB())
		incPC()
	},

	//0x51
	() => {
		setD(getC())
		incPC()
	},

	//0x52
	() => {
		incPC()
	},

	//0x53
	() => {
		setD(getE())
		incPC()
	},

	//0x54
	() => {
		setD(getH())
		incPC()
	},

	//0x55
	() => {
		setD(getL())
		incPC()
	},

	//0x56
	() => {
		setD(getRAMatHL())
		incPC()
	},

	//0x57
	() => {
		setD(getA())
		incPC()
	},

	//0x58
	() => {
		setE(getB())
		incPC()
	},

	//0x59
	() => {
		setE(getC())
		incPC()
	},

	//0x5A
	() => {
		setE(getD())
		incPC()
	},

	//0x5B
	() => {
		incPC()
	},

	//0x5C
	() => {
		setE(getH())
		incPC()
	},

	//0x5D
	() => {
		setE(getL())
		incPC()
	},

	//0x5E
	() => {
		setE(getRAMatHL())
		incPC()
	},

	//0x5F
	() => {
		setE(getA())
		incPC()
	},

	//0x60
	() => {
		setH(getB())
		incPC()
	},

	//0x61
	() => {
		setH(getC())
		incPC()
	},

	//0x62
	() => {
		setH(getD())
		incPC()
	},

	//0x63
	() => {
		setH(getE())
		incPC()
	},

	//0x64
	() => {
		incPC()
	},

	//0x65
	() => {
		setH(getL())
		incPC()
	},

	//0x66
	() => {
		setH(getRAMatHL())
		incPC()
	},

	//0x67
	() => {
		setH(getA())
		incPC()
	},

	//0x68
	() => {
		setL(getB())
		incPC()
	},

	//0x69
	() => {
		setL(getC())
		incPC()
	},

	//0x6A
	() => {
		setL(getD())
		incPC()
	},

	//0x6B
	() => {
		setL(getE())
		incPC()
	},

	//0x6C
	() => {
		setL(getH())
		incPC()
	},

	//0x6D
	() => {
		incPC()
	},

	//0x6E
	() => {
		setL(getRAMatHL())
		incPC()
	},

	//0x6F
	() => {
		setL(getA())
		incPC()
	},

	//0x70
	() => {
		setRAM(getHL(), getB())
		incPC()
	},

	//0x71
	() => {
		setRAM(getHL(), getC())
		incPC()
	},

	//0x72
	() => {
		setRAM(getHL(), getD())
		incPC()
	},

	//0x73
	() => {
		setRAM(getHL(), getE())
		incPC()
	},

	//0x74
	() => {
		setRAM(getHL(), getH())
		incPC()
	},

	//0x75
	() => {
		setRAM(getHL(), getL())
		incPC()
	},

	//0x76
	() => {
		incPC()
	},

	//0x77
	() => {
		setRAM(getHL(), getA())
		incPC()
	},

	//0x78
	() => {
		setA(getB())
		incPC()
	},

	//0x79
	() => {
		setA(getC())
		incPC()
	},

	//0x7A
	() => {
		setA(getD())
		incPC()
	},

	//0x7B
	() => {
		setA(getE())
		incPC()
	},

	//0x7C
	() => {
		setA(getH())
		incPC()
	},

	//0x7D
	() => {
		setA(getL())
		incPC()
	},

	//0x7E
	() => {
		setA(getRAMatHL())
		incPC()
	},

	//0x7F
	() => {
		incPC()
	},

	//0x80
	() => {
		oldA = getA()
		addReg("A", getB())
		setStdAddFlags8(oldA, getB())
		incPC()
	},

	//0x81
	() => {
		oldA = getA()
		addReg("A", getC())
		setStdAddFlags8(oldA, getC())
		incPC()
	},

	//0x82
	() => {
		oldA = getA()
		addReg("A", getD())
		setStdAddFlags8(oldA, getD())
		incPC()
	},

	//0x83
	() => {
		oldA = getA()
		addReg("A", getE())
		setStdAddFlags8(oldA, getE())
		incPC()
	},

	//0x84
	() => {
		oldA = getA()
		addReg("A", getH())
		setStdAddFlags8(oldA, getH())
		incPC()
	},

	//0x85
	() => {
		oldA = getA()
		addReg("A", getL())
		setStdAddFlags8(oldA, getL())
		incPC()
	},

	//0x86
	() => {
		oldA = getA()
		addReg("A", getRAMatHL())
		setStdAddFlags8(oldA, getRAMatHL())
		incPC()
	},

	//0x87
	() => {
		oldA = getA()
		addReg("A", oldA)
		setStdAddFlags8(oldA, oldA)
		incPC()
	},

	//0x88
	() => {
		oldA = getA()
		addReg("A", getB() + getCFlag())
		setStdAddFlags8(oldA, getB() + getCFlag())
		incPC()
	},

	//0x89
	() => {
		oldA = getA()
		addReg("A", getC() + getCFlag())
		setStdAddFlags8(oldA, getC() + getCFlag())
		incPC()
	},

	//0x8A
	() => {
		oldA = getA()
		addReg("A", getD() + getCFlag())
		setStdAddFlags8(oldA, getD() + getCFlag())
		incPC()
	},

	//0x8B
	() => {
		oldA = getA()
		addReg("A", getE() + getCFlag())
		setStdAddFlags8(oldA, getE() + getCFlag())
		incPC()
	},

	//0x8C
	() => {
		oldA = getA()
		addReg("A", getH() + getCFlag())
		setStdAddFlags8(oldA, getH() + getCFlag())
		incPC()
	},

	//0x8D
	() => {
		oldA = getA()
		addReg("A", getL() + getCFlag())
		setStdAddFlags8(oldA, getL() + getCFlag())
		incPC()
	},

	//0x8E
	() => {
		oldA = getA()
		addReg("A", getRAMatHL() + getCFlag())
		setStdAddFlags8(oldA, getRAMatHL() + getCFlag())
		incPC()
	},

	//0x8F
	() => {
		oldA = getA()
		addReg("A", oldA + getCFlag())
		setStdAddFlags8(oldA, oldA + getCFlag())
		incPC()
	},

	//0x90
	() => {
		oldA = getA()
		subReg("A", getB())
		setStdSubFlags8(oldA, getB())
		incPC()
	},

	//0x91
	() => {
		oldA = getA()
		subReg("A", getC())
		setStdSubFlags8(oldA, getC())
		incPC()
	},

	//0x92
	() => {
		oldA = getA()
		subReg("A", getD())
		setStdSubFlags8(oldA, getD())
		incPC()
	},

	//0x93
	() => {
		oldA = getA()
		subReg("A", getE())
		setStdSubFlags8(oldA, getE())
		incPC()
	},

	//0x94
	() => {
		oldA = getA()
		subReg("A", getH())
		setStdSubFlags8(oldA, getH())
		incPC()
	},

	//0x95
	() => {
		oldA = getA()
		subReg("A", getL())
		setStdSubFlags8(oldA, getL())
		incPC()
	},

	//0x96
	() => {
		oldA = getA()
		subReg("A", getB())
		setStdSubFlags8(oldA, getB())
		incPC()
	},

	//0x97
	() => {
		oldA = getA()
		subReg("A", getA())
		setStdSubFlags8(oldA, getA())
		incPC()
	},

	//0x98
	() => {
		oldA = getA()
		subReg("A", getB() + getCFlag())
		setStdSubFlags8(oldA, getB() + getCFlag())
		incPC()
	},

	//0x99
	() => {
		oldA = getA()
		subReg("A", getC() + getCFlag())
		setStdSubFlags8(oldA, getC() + getCFlag())
		incPC()
	},

	//0x9A
	() => {
		oldA = getA()
		subReg("A", getD() + getCFlag())
		setStdSubFlags8(oldA, getD() + getCFlag())
		incPC()
	},

	//0x9B
	() => {
		oldA = getA()
		subReg("A", getE() + getCFlag())
		setStdSubFlags8(oldA, getE() + getCFlag())
		incPC()
	},

	//0x9C
	() => {
		oldA = getA()
		subReg("A", getH() + getCFlag())
		setStdSubFlags8(oldA, getH() + getCFlag())
		incPC()
	},

	//0x9D
	() => {
		oldA = getA()
		subReg("A", getL() + getCFlag())
		setStdSubFlags8(oldA, getL() + getCFlag())
		incPC()
	},

	//0x9E
	() => {
		oldA = getA()
		subReg("A", getRAMatHL() + getCFlag())
		setStdSubFlags8(oldA, getRAMatHL() + getCFlag())
		incPC()
	},

	//0x9F
	() => {
		oldA = getA()
		subReg("A", oldA + getCFlag())
		setStdSubFlags8(oldA, oldA + getCFlag())
		incPC()
	},

	//0xA0
	() => {
		setA(getA()&getB())
		setStdAndFlags8(getA())
		incPC()
	},

	//0xA1
	() => {
		setA(getA()&getC())
		setStdAndFlags8(getA())
		incPC()
	},

	//0xA2
	() => {
		setA(getA()&getD())
		setStdAndFlags8(getA())
		incPC()
	},

	//0xA3
	() => {
		setA(getA()&getE())
		setStdAndFlags8(getA())
		incPC()
	},

	//0xA4
	() => {
		setA(getA()&getH())
		setStdAndFlags8(getA())
		incPC()
	},

	//0xA5
	() => {
		setA(getA()&getL())
		setStdAndFlags8(getA())
		incPC()
	},

	//0xA6
	() => {
		setA(getA()&getRAMatHL())
		setStdAndFlags8(getA())
		incPC()
	},

	//0xA7
	() => {
		setA(getA()&getA())
		setStdAndFlags8(getA())
		incPC()
	},

	//0xA8
	() => {
		setA(getA()^getB())
		setStdOrFlags8(getA())
		incPC()
	},

	//0xA9
	() => {
		setA(getA()^getC())
		setStdOrFlags8(getA())
		incPC()
	},

	//0xAA
	() => {
		setA(getA()^getD())
		setStdOrFlags8(getA())
		incPC()
	},

	//0xAB
	() => {
		setA(getA()^getE())
		setStdOrFlags8(getA())
		incPC()
	},

	//0xAC
	() => {
		setA(getA()^getH())
		setStdOrFlags8(getA())
		incPC()
	},

	//0xAD
	() => {
		setA(getA()^getL())
		setStdOrFlags8(getA())
		incPC()
	},

	//0xAE
	() => {
		setA(getA()^getRAMatHL())
		setStdOrFlags8(getA())
		incPC()
	},

	//0xAF
	() => {
		setA(getA()^getA())
		setStdOrFlags8(getA())
		incPC()
	},

	//0xB0
	() => {
		setA(getA()|getB())
		setStdOrFlags8(getA())
		incPC()
	},

	//0xB1
	() => {
		setA(getA()|getC())
		setStdOrFlags8(getA())
		incPC()
	},

	//0xB2
	() => {
		setA(getA()|getD())
		setStdOrFlags8(getA())
		incPC()
	},

	//0xB3
	() => {
		setA(getA()|getE())
		setStdOrFlags8(getA())
		incPC()
	},

	//0xB4
	() => {
		setA(getA()|getH())
		setStdOrFlags8(getA())
		incPC()
	},

	//0xB5
	() => {
		setA(getA()|getL())
		setStdOrFlags8(getA())
		incPC()
	},

	//0xB6
	() => {
		setA(getA()|getRAMatHL())
		setStdOrFlags8(getA())
		incPC()
	},

	//0xB7
	() => {
		setA(getA()|getA())
		setStdOrFlags8(getA())
		incPC()
	},

	//0xB8
	() => {
		oldA = getA()
		subReg("A", getB())
		setStdSubFlags8(oldA, getB())
		setA(oldA)
		incPC()
	},

	//0xB9
	() => {
		oldA = getA()
		subReg("A", getC())
		setStdSubFlags8(oldA, getC())
		setA(oldA)
		incPC()
	},

	//0xBA
	() => {
		oldA = getA()
		subReg("A", getD())
		setStdSubFlags8(oldA, getD())
		setA(oldA)
		incPC()
	},

	//0xBB
	() => {
		oldA = getA()
		subReg("A", getE())
		setStdSubFlags8(oldA, getE())
		setA(oldA)
		incPC()
	},

	//0xBC
	() => {
		oldA = getA()
		subReg("A", getH())
		setStdSubFlags8(oldA, getH())
		setA(oldA)
		incPC()
	},

	//0xBD
	() => {
		oldA = getA()
		subReg("A", getL())
		setStdSubFlags8(oldA, getL())
		setA(oldA)
		incPC()
	},

	//0xBE
	() => {
		oldA = getA()
		subReg("A", getRAMatHL())
		setStdSubFlags8(oldA, getRAMatHL())
		setA(oldA)
		incPC()
	},

	//0xBF
	() => {
		oldA = getA()
		subReg("A", oldA)
		setStdSubFlags8(oldA, oldA)
		setA(oldA)
		incPC()
	},

	//0xC0
	() => {
		if (!getCFlag()) {
			setPC(popStack())
			eResult.isJump = true
		} else {
			incPC()
		}
	},

	//0xC1
	() => {
		set16reg("BC", popStack())
		incPC()
	},

	//0xC2
	() => {
		if (!getZFlag()) {
			setPC(getP12())
			eResult.isJump = true
		} else {
			addPC(3)
		}
	},

	//0xC3
	() => {
		setPC(getP12())
		eResult.isJump = true
	},

	//0xC4
	() => {
		if (!getZFlag()) {
			pushStack((getPC() + 3) % 65536)
			setPC(getP12())
		} else {
			addPC(3)
		}
	},

	//0xC5
	() => {
		pushStack(getBC())
		incPC()
	},

	//0xC6
	() => {
		oldA = getA()
		addReg("A", getP1())
		setStdAddFlags8(oldA, getP1())
		addPC(2)
	},

	//0xC7
	() => {
		pushStack((getPC() + 1) % 65536)
		setPC(0)
	},

	//0xC8
	() => {
		if (getZFlag()) {
			setPC(popStack())
			eResult.isJump = true
		} else {
			incPC()
		}
	},

	//0xC9
	() => {
		setPC(popStack())
		eResult.isJump = true
	},

	//0xCA
	() => {
		if (getZFlag()) {
			setPC(getP12())
			eResult.isJump = true
		} else {
			addPC(3)
		}
	},

	//0xCB
	() => {
		//BIT instructions
		//gets opcode
		let operation = getP1()

		let target = [
			"B",
			"C",
			"D",
			"E",
			"H",
			"L",
			"(HL)", //placeholder
			"A"
		][operation % 8]

		//figures out which bit to test/modify
		let bit = Math.floor((operation - 0x40) / 8)

		if (operation < 0x40) {

			//gets instruction type to perform
			let ins = Math.floor(operation / 8)

			let oldTargetValue = getReg(target)

			//rlc x
			if (ins == 0) {
				setNFlag(0)
				setHFlag(0)

				bit7 = getBit(oldTargetValue, 7)
				setCFlag(bit7)

				addReg(target, getReg(target))
				setReg(target, modifyBit(getReg(target), 0, bit7))

				setStdRlFlagsL(oldTargetValue, getReg(target))
			//rrc x
			} else if (ins == 1) {
				setNFlag(0)
				setHFlag(0)

				bit0 = getBit(oldTargetValue, 0)
				setCFlag(bit0)

				setReg(target, bit0*0x80 + Math.floor(getReg(target)/2))

				setStdRlFlagsR(oldTargetValue, getReg(target))
			//rl x
			} else if (ins == 2) {
				setNFlag(0)
				setHFlag(0)

				bit7 = getBit(oldTargetValue, 7)
				cFlag = getCFlag()
				setCFlag(bit7)

				setReg(target, cFlag + getReg(target)*2)

				setStdRlFlagsL(oldTargetValue, getReg(target))
			//rr x
			} else if (ins == 3) {
				setHFlag(0)
				setNFlag(0)

				//01111111
				//00111111

				bit0 = getBit(oldTargetValue, 0)
				cFlag = getCFlag()
				setCFlag(bit0)

				setReg(target, cFlag*0x80 + Math.floor(getReg(target)/2))

				setStdRlFlagsR(oldTargetValue, getReg(target))
			}

		} else {

			//bit n,x
			if (operation >= 0x40 && operation <= 0x7F) {
				//resets N/H
				setNFlag(0)
				setHFlag(0)

				//if (HL)
				if (operation % 8 == 6) {
					//gets specified bit of (HL)
					setZFlag(getBit(getRAMatHL(), bit))
				//if normal register
				} else {
					//gets specified bit of target reg
					setZFlag(getBit(getReg(target), bit))
				}
			//res n,x
			} else if (operation >= 0x80 && operation <= 0xBF) {
				//if (HL)
				if (operation % 8 == 6) {
					//resets specified bit of (HL)
					setRAMatReg("HL", resetBit(getRAMatHL(), bit))
				//if normal register
				} else {
					//resets specified bit of target reg
					setReg(target, resetBit(getReg(target), bit))
				}
			//set n,x (same as res n,x but sets instead of resets)
			} else if (operation >= 0xC0) {
				//if (HL)
				if (operation % 8 == 6) {
					//resets specified bit of (HL)
					setRAMatReg("HL", setBit(getRAMatHL(), bit))
				//if normal register
				} else {
					//resets specified bit of target reg
					setReg(target, setBit(getReg(target), bit))
				}
			}

		}
	},

	//0xCC
	() => {
		if (getZFlag()) {
			pushStack((getPC() + 3) % 65536)
			setPC(getP12())
			eResult.isJump = true
		} else {
			addPC(3)
		}
	},

	//0xCD
	() => {
		pushStack((getPC() + 3) % 65536)
		setPC(getP12())
		eResult.isJump = true
	},

	//0xCE
	() => {
		oldA = getA()
		addReg("A", getP1() + getCFlag())
		setStdAddFlags8(oldA, getP1() + getCFlag())
		addPC(2)
	},

	//0xCF
	() => {
		pushStack((getPC() + 1) % 65536)
		setPC(8)
	},

	//0xD0
	() => {
		if (!getCFlag()) {
			setPC(popStack())
			eResult.isJump = true
		} else {
			incPC()
		}
	},

	//0xD1
	() => {
		set16reg("DE", popStack())
		incPC()
	},

	//0xD2
	() => {
		if (!getCFlag()) {
			setPC(getP12())
			eResult.isJump = true
		} else {
			addPC(3)
		}
	},

	//0xD3
	() => {
		handlePortWrite(getP1(), getA())
		addPC(2)
	},

	//0xD4
	() => {
		if (!getCFlag()) {
			pushStack((getPC() + 3) % 65536)
			setPC(getP12())
			eResult.isJump = true
		} else {
			addPC(3)
		}
	},

	//0xD5
	() => {
		pushStack(getDE())
		incPC()
	},

	//0xD6
	() => {
		oldA = getA()
		subReg("A", getP1())
		setStdSubFlags8(oldA, getP1())
		addPC(2)
	},

	//0xD7
	() => {
		pushStack((getPC() + 1) % 65536)
		setPC(0x10)
		incPC()
	},

	//0xD8
	() => {
		if (getCFlag()) {
			setPC(popStack())
			eResult.isJump = true
		} else {
			incPC()
		}
	},

	//0xD9
	() => {
		swapAllShad()
		incPC()
	},

	//0xDA
	() => {
		if (getCFlag()) {
			setPC(getP12())
			eResult.isJump = true
		} else {
			addPC(3)
		}
	},

	//0xDB
	() => {
		setA(handlePortRead(getP1()))
		addPC(2)
	},

	//0xDC
	() => {
		if (getCFlag()) {
			pushStack((getPC() + 3) % 65536)
			setPC(getP12())
			eResult.isJump = true
		} else {
			addPC(3)
		}
	},

	//0xDD
	() => {

	},

	//0xDE
	() => {
		oldA = getA()
		subReg("A", getP1() + getCFlag())
		setStdSubFlags8(oldA, getP1() + getCFlag())
		addPC(2)
	},

	//0xDF
	() => {
		pushStack((getPC() + 1) % 65536)
		setPC(0x18)
	},

	//0xE0
	() => {
		if (!getPFlag()) {
			setPC(popStack())
			eResult.isJump = true
		} else {
			incPC()
		}
	},

	//0xE1
	() => {
		set16reg("HL", popStack())
		incPC()
	},

	//0xE2
	() => {
		if (!getPFlag()) {
			setPC(getP12())
			eResult.isJump = true
		} else {
			addPC(3)
		}
	},

	//0xE3
	() => {
		oldHL = getHL()
		set16reg("HL", getRAMatSP())
		setRAM(getSP(), oldHL)
		incPC()
	},

	//0xE4
	() => {
		//call po,**
		if (!getPFlag()) {
			pushStack((getPC() + 3) % 65536)
			setPC(getP12())
			eResult.isJump = true
		} else {
			addPC(3)
		}
	},

	//0xE5
	() => {
		pushStack(getHL())
		incPC()
	},

	//0xE6
	() => {
		setA(getA()&getP1())
		setStdAndFlags8(getA())
		incPC()
	},

	//0xE7
	() => {
		pushStack((getPC() + 1) % 65536)
		setPC(0x20)
		eResult.isJump = true
	},

	//0xE8
	() => {
		if (getPFlag()) {
			setPC(popStack())
			eResult.isJump = true
		} else {
			incPC()
		}
	},

	//0xE9
	() => {
		setPC(getHL())
	},

	//0xEA
	() => {
		if (getPFlag()) {
			setPC(getP12())
			eResult.isJump = true
		} else {
			addPC(3)
		}
	},

	//0xEB
	() => {
		oldDE = getDE()
		setDE(getHL())
		setHL(oldDE)
		incPC()
	},

	//0xEC
	() => {
		if (getPFlag()) {
			pushStack((getPC() + 3) % 65536)
			setPC(getP12())
			eResult.isJump = true
		} else {
			addPC(3)
		}
	},

	//0xED
	() => {
		//EXTD
		let operation = getP1()
		incPC()

		//exec instruction
		extdTable[operation-0x40]()
	},

	//0xEE
	() => {
		setA(getA()^getP1())
		setStdOrFlags8(getA())
		addPC(2)
	},

	//0xEF
	() => {
		pushStack((getPC() + 1) % 65536)
		setPC(0x28)
	},

	//0xF0
	() => {
		if (!getSFlag()) {
			setPC(popStack())
			eResult.isJump = true
		} else {
			incPC()
		}
	},

	//0xF1
	() => {
		set16reg("AF", popStack())
		incPC()
	},

	//0xF2
	() => {
		if (!getSFlag()) {
			setPC(getP12())
			eResult.isJump = true
		} else {
			addPC(3)
		}
	},

	//0xF3
	() => {
		//di
		incPC()
	},

	//0xF4
	() => {
		if (!getSFlag()) {
			pushStack((getPC() + 3))
			setPC(getP12())
			eResult.isJump = true
		} else {
			addPC(3)
		}
	},

	//0xF5
	() => {
		pushStack(getAF())
		incPC()
	},

	//0xF6
	() => {
		setA(getA()|getP1())
		setStdOrFlags8(getA())
		addPC(2)
	},

	//0xF7
	() => {
		pushStack((getPC() + 1) % 65536)
		setPC(0x30)
	},

	//0xF8
	() => {
		if (getSFlag()) {
			setPC(popStack())
			eResult.isJump = true
		} else {
			incPC()
		}
	},

	//0xF9
	() => {
		setSP(getHL())
		incPC()
	},

	//0xFA
	() => {
		if (getSFlag()) {
			pushStack((getPC() + 3) % 65536)
			setPC(getP12())
			eResult.isJump = true
		} else {
			addPC(3)
		}
	},

	//0xFB
	() => {
		//ei
		incPC()
	},

	//0xFC
	() => {
		if (getSFlag()) {
			pushStack((getPC() + 3) % 65536)
			setPC(getP12())
			eResult.isJump = true
		} else {
			addPC(3)
		}
	},

	//0xFD
	() => {

	},

	//0xFE
	() => {
		setStdSubFlags8(getA(), getP1())
		addPC(2)
	},

	//0xFF
	() => {
		pushStack((getPC() + 1) % 65536)
		setPC(0x38)
	},
	
]

function exec() {
	eResult.isJump = false

	//execute instruction
	execTable[getNextByte()]()

	//return data object
	return eResult
}