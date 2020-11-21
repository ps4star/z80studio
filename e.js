//RAM execution script
function getPar(n) {
	//gets parity of number
	return (n.toString(2).match(/1/g) || []).length
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

function getP3() {
	//returns 3 bytes after PC (used for 1-byte ext instructions)
	return sys.RAM[sys.PC[0]+3]
}

function getP4() {
	//returns 4 bytes after PC (used for 2-byte ext instructions)
	return sys.RAM[sys.PC[0]+4]
}

function setPC(n) {
	sys.PC[0] = n
	registers16.PC.value = lzfill(sys.PC[0].toString(16), 4)
}

function addPC(n) {
	sys.PC[0] += n
	registers16.PC.value = lzfill(sys.PC[0].toString(16), 4)
}

function subPC(n) {
	sys.PC[0] -= n
	registers16.PC.value = lzfill(sys.PC[0].toString(16), 4)
}

function incPC() {
	sys.PC[0]++
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
	if (n >= 32768) {
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

	if ((oldVal&0x80) == 0x80) {
		//if bit 7 is set

	}

	updateF()
}

function setStdRlFlagsR(oldVal, newVal) {
	//reset N/H
	setNFlag(0)
	setHFlag(0)

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

function exec() {
	//data for step mode
	let eResult = {
		isJump : false
	}

	//loads opcode from RAM (PC)
	let opcode = getNextByte()

	//execute instruction
	let oldA
	switch(opcode) {
		case 0x00:
			//nop
			break
		case 0x01:
			//ld bc,**
			setB(getP1())
			setC(getP2())
			addPC(3)
			break
		case 0x02:
			//ld (bc),a
			setRAM(getRAMatReg("BC"), getA())
			incPC()
			break
		case 0x03:
			//inc bc
			add16reg("BC", 0x01)
			setStdIncFlags16(getBC())
			incPC()
			break
		case 0x04:
			//inc b
			addReg("B", 0x01)
			setStdIncFlags(getB())
			incPC()
			break
		case 0x05:
			//dec b
			subReg("B", 0x01)
			setStdDecFlags8(getB())
			incPC()
			break
		case 0x06:
			//ld b,*
			setB(getP1())
			addPC(2)
			break
		case 0x07:
			//rlca
			setNFlag(0)
			setHFlag(0)

			oldA = getA()

			//stores bit 7 so it can be set to bit 0 later
			let bit7 = getBit(getA(), 7)
			setCFlag(bit7)

			//performs left bitshift on A
			addReg("A", getA())
			setA(modifyBit(getA(), 0, bit7))
			setStdRlFlagsL(oldA, getA())
			incPC()
			break
		case 0x08:
			//ex af,af'
			swapSingleShad("A")
			swapSingleShad("F")
			incPC()
			break
		case 0x09:
			//add hl,bc
			let oldHL = getHL()
			add16reg("HL", getBC())
			setStdAddFlags16(oldHL, getBC())
			incPC()
			break
		case 0x0A:
			//ld a,(bc)
			setA(getRAMatReg("BC"))
			incPC()
			break
		case 0x0B:
			//dec bc
			sub16reg("BC", 0x01)
			setStdDecFlags16(getBC())
			incPC()
			break
		case 0x0C:
			//inc c
			addReg("C", 0x01)
			setStdIncFlags8(getC())
			incPC()
			break
		case 0x0D:
			//dec c
			subReg("C", 0x01)
			setStdDecFlags8(getC())
			incPC()
			break
		case 0x0E:
			//ld c,*
			setC(getP1())
			addPC(2)
			break
		case 0x0F:
			//rrca
			setNFlag(0)
			setHFlag(0)

			oldA = getA()

			//stores bit 0 so it can be set to bit 7 later
			let bit0 = getBit(oldA, 0)
			setCFlag(bit0)

			//performs right bitshift on A
			setA(bit0*0x80 + Math.floor(getA()/2))

			setStdRlFlagsR(oldA, getA())
			incPC()
			break
		case 0x10:
			//djnz *
			subReg("B", 0x01)
			if (getB() != 0) {
				addPC(handleSignedUint8(getP1()))
			} else {
				addPC(2)
			}
			break
		case 0x11:
			//ld de,**
			set16reg("DE", make16(getP1(), getP2()))
			addPC(3)
			break
		case 0x12:
			//ld (de),a
			setRAM(getDE(), getA())
			incPC()
			break
		case 0x13:
			//inc de
			add16reg("DE", 0x01)
			setStdIncFlags16(getDE())
			incPC()
			break
		case 0x14:
			//inc d
			addReg("D", 0x01)
			setStdIncFlags8(getD())
			incPC()
			break
		case 0x15:
			//dec d
			subReg("D", 0x01)
			setStdDecFlags8(getD())
			incPC()
			break
		case 0x16:
			//ld d,*
			setD(getP1())
			addPC(2)
			break
		case 0x17:
			//rla
			setNFlag(0)
			setHFlag(0)

			oldA = getA()

			bit7 = getBit(oldA, 7)
			let cFlag = getCFlag()
			setCFlag(bit7)

			addReg("A", getA())
			setA(modifyBit(getA(), 0, bit7))
			setStdRlFlagsL(oldA, getA())
			incPC()
			break
		case 0x18:
			//jr *
			addPC(handleSignedUint8(getP1()))
			eResult.isJump = true
			break
		case 0x19:
			//add hl,de
			oldHL = getHL()
			add16reg("HL", getDE())
			setStdAddFlags16(oldHL, getDE())
			incPC()
			break
		case 0x1A:
			//ld a,(de)
			setA(getRAMatReg("DE"))
			incPC()
			break
		case 0x1B:
			//dec de
			sub16reg("DE", 0x01)
			setStdDecFlags16(getDE())
			incPC()
			break
		case 0x1C:
			//inc e
			addReg("E", 0x01)
			setStdIncFlags8(getE())
			incPC()
			break
		case 0x1D:
			//dec e
			subReg("E", 0x01)
			setStdDecFlags8(getE())
			incPC()
			break
		case 0x1E:
			//ld e,*
			setE(getP1())
			addPC(2)
			break
		case 0x1F:
			//rra
			setHFlag(0)
			setNFlag(0)

			oldA = getA()

			bit0 = getBit(oldA, 0)
			cFlag = getCFlag()
			setCFlag(bit0)

			setA(cFlag*0x80 + Math.floor(getA()/2))

			setStdRlFlagsR(oldA, getA())
			incPC()
			break
		case 0x20:
			//jr nz,*
			if (!getZFlag()) {
				addPC(getP1())
				eResult.isJump = true
			} else {
				addPC(2)
			}
			break
		case 0x21:
			//ld hl,**
			set16reg("HL", make16(getP1(), getP2()))
			addPC(3)
			break
		case 0x22:
			//ld (**),hl
			setRAM(make16(getP1(), getP2()), getHL())
			addPC(3)
			break
		case 0x23:
			//inc hl
			addHL(1)
			setStdIncFlags16(getHL())
			incPC()
			break
		case 0x24:
			//inc h
			addReg("H", 0x01)
			setStdIncFlags8(getH())
			incPC()
			break
		case 0x25:
			//dec h
			subReg("H", 0x01)
			setStdDecFlags8(getH())
			incPC()
			break
		case 0x26:
			//ld h,*
			setH(getP1())
			addPC(2)
			break
		case 0x27:
			//daa

			//if H is set OR lower 4 bits > 9
			if (getHFlag() == 1 || (getA()&0xF) > 9) {
				//add $06 to a
				addReg("A", 0x6)
				setHFlag(1)
			}

			let needed2nd = false

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
			break
		case 0x28:
			//jr z,*
			if (getZFlag()) {
				addPC(handleSignedUint8(getP1()))
				eResult.isJump = true
			} else {
				addPC(2)
			}
			break
		case 0x29:
			//add hl,hl
			oldHL = getHL()
			add16reg("HL", oldHL)
			setStdAddFlags16(oldHL, oldHL)
			incPC()
			break
		case 0x2A:
			//ld hl,(**)
			set16reg("HL", make16(getP1(), getP2()))
			addPC(3)
			break
		case 0x2B:
			//dec hl
			sub16reg("HL", 0x01)
			setStdDecFlags16(getHL())
			incPC()
			break
		case 0x2C:
			//inc l
			addReg("L", 0x01)
			setStdIncFlags8(getL())
			incPC()
			break
		case 0x2D:
			//dec l
			subReg("L", 0x01)
			setStdDecFlags8(getL())
			incPC()
			break
		case 0x2E:
			//ld l,*
			setL(getP1())
			addPC(2)
			break
		case 0x2F:
			//cpl
			setA(inv8bit(getA()))
			setNFlag(1)
			setHFlag(1)
			incPC()
			break
		case 0x30:
			//jr nc,*
			if (!getCFlag()) {
				addPC(handleSignedUint8(getP1()))
				eResult.isJump = true
			} else {
				addPC(2)
			}
			break
		case 0x31:
			//ld sp,**
			setSP(make16(getP1(), getP2()))
			addPC(3)
			break
		case 0x32:
			//ld (**),a
			setRAM(make16(getP1(), getP2()), getA())
			addPC(3)
			break
		case 0x33:
			//inc sp
			addSP(0x01)
			incPC()
			break
		case 0x34:
			//inc (hl)
			addRAM(getHL(), 0x01)
			setStdIncFlags16(getRAMatReg("HL"))
			incPC()
			break
		case 0x35:
			//dec (hl)
			subRAM(getHL(), 0x01)
			setStdDecFlags16(getRAMatReg("HL"))
			incPC()
			break
		case 0x36:
			//ld (hl),*
			setRAM(getHL(), getP1())
			addPC(2)
			break
		case 0x37:
			//scf
			setCFlag(1)
			setNFlag(0)
			setHFlag(0)
			incPC()
			break
		case 0x38:
			//jr c,*
			if (!!getCFlag()) {
				addPC(handleSignedUint8(getP1()))
				eResult.isJump = true
			} else {
				addPC(2)
			}
			break
		case 0x39:
			//add hl,sp
			oldHL = getHL()
			add16reg("HL", getSP())
			setStdAddFlags16(oldHL, getSP())
			incPC()
			break
		case 0x3A:
			//ld a,(**)
			setA(getRAM(make16(getP1(), getP2())))
			addPC(3)
			break
		case 0x3B:
			//dec sp
			subSP(0x01)
			setStdDecFlags16(getSP())
			incPC()
			break
		case 0x3C:
			//inc a
			addReg("A", 0x01)
			setStdIncFlags8(getA())
			incPC()
			break
		case 0x3D:
			//dec a
			subReg("A", 0x01)
			setStdDecFlags8(getA())
			incPC()
			break
		case 0x3E:
			//ld a,*
			setA(getP1())
			addPC(2)
			break
		case 0x3F:
			//ccf
			setNFlag(0)
			setCFlag(!getCFlag() ? 1 : 0)
			setHFlag(getCFlag())
			incPC()
			break
		case 0x40:
			//ld b,x
			incPC()
			break
		case 0x41:
			setB(getC())
			incPC()
			break
		case 0x42:
			setB(getD())
			incPC()
			break
		case 0x43:
			setB(getE())
			incPC()
			break
		case 0x44:
			setB(getH())
			incPC()
			break
		case 0x45:
			setB(getL())
			incPC()
			break
		case 0x46:
			setB(getRAMatReg("HL"))
			incPC()
			break
		case 0x47:
			setB(getA())
			incPC()
			break
		case 0x48:
			//ld c,x
			setC(getB())
			incPC()
			break
		case 0x49:
			incPC()
			break
		case 0x4A:
			setC(getD())
			incPC()
			break
		case 0x4B:
			setC(getE())
			incPC()
			break
		case 0x4C:
			setC(getH())
			incPC()
			break
		case 0x4D:
			setC(getL())
			incPC()
			break
		case 0x4E:
			setC(getRAMatReg("HL"))
			incPC()
			break
		case 0x4F:
			setC(getA())
			incPC()
			break
		case 0x50:
			//ld d,x
			setD(getB())
			incPC()
			break
		case 0x51:
			setD(getC())
			incPC()
			break
		case 0x52:
			incPC()
			break
		case 0x53:
			setD(getE())
			incPC()
			break
		case 0x55:
			setD(getH())
			incPC()
			break
		case 0x55:
			setD(getL())
			incPC()
			break
		case 0x56:
			setD(getRAMatReg("HL"))
			incPC()
			break
		case 0x57:
			setD(getA())
			incPC()
			break
		case 0x58:
			//ld e,x
			setE(getB())
			incPC()
			break
		case 0x59:
			setE(getC())
			incPC()
			break
		case 0x5A:
			setE(getD())
			incPC()
			break
		case 0x5B:
			incPC()
			break
		case 0x5C:
			setE(getH())
			incPC()
			break
		case 0x5D:
			setE(getL())
			incPC()
			break
		case 0x5E:
			setE(getRAMatReg("HL"))
			incPC()
			break
		case 0x5F:
			setE(getA())
			incPC()
			break
		case 0x60:
			//ld h,x
			setH(getB())
			incPC()
			break
		case 0x61:
			setH(getC())
			incPC()
			break
		case 0x62:
			setH(getD())
			incPC()
			break
		case 0x63:
			setH(getE())
			incPC()
			break
		case 0x64:
			incPC()
			break
		case 0x65:
			setH(getL())
			incPC()
			break
		case 0x66:
			setH(getRAMatReg("HL"))
			incPC()
			break
		case 0x67:
			setH(getA())
			incPC()
			break
		case 0x68:
			//ld l,x
			setL(getB())
			incPC()
			break
		case 0x69:
			setL(getC())
			incPC()
			break
		case 0x6A:
			setL(getD())
			incPC()
			break
		case 0x6B:
			setL(getE())
			incPC()
			break
		case 0x6C:
			setL(getH())
			incPC()
			break
		case 0x6D:
			incPC()
			break
		case 0x6E:
			setL(getRAMatReg("HL"))
			incPC()
			break
		case 0x6F:
			setL(getA())
			incPC()
			break
		case 0x70:
			//ld (hl),x
			setRAM(getHL(), getB())
			incPC()
			break
		case 0x71:
			setRAM(getHL(), getC())
			incPC()
			break
		case 0x72:
			setRAM(getHL(), getD())
			incPC()
			break
		case 0x73:
			setRAM(getHL(), getE())
			incPC()
			break
		case 0x74:
			setRAM(getHL(), getH())
			incPC()
			break
		case 0x75:
			setRAM(getHL(), getL())
			incPC()
			break
		case 0x76:
			//halt
			incPC()
			break
		case 0x77:
			setRAM(getHL(), getA())
			incPC()
			break
		case 0x78:
			//ld a,x
			setA(getB())
			incPC()
			break
		case 0x79:
			setA(getC())
			incPC()
			break
		case 0x7A:
			setA(getD())
			incPC()
			break
		case 0x7B:
			setA(getE())
			incPC()
			break
		case 0x7C:
			setA(getH())
			incPC()
			break
		case 0x7D:
			setA(getL())
			incPC()
			break
		case 0x7E:
			setA(getRAMatReg("HL"))
			incPC()
			break
		case 0x7F:
			incPC()
			break
		case 0x80:
			//add a,x
			oldA = getA()
			addReg("A", getB())
			setStdAddFlags8(oldA, getB())
			incPC()
			break
		case 0x81:
			oldA = getA()
			addReg("A", getC())
			setStdAddFlags8(oldA, getC())
			incPC()
			break
		case 0x82:
			oldA = getA()
			addReg("A", getD())
			setStdAddFlags8(oldA, getD())
			incPC()
			break
		case 0x83:
			oldA = getA()
			addReg("A", getE())
			setStdAddFlags8(oldA, getE())
			incPC()
			break
		case 0x84:
			oldA = getA()
			addReg("A", getH())
			setStdAddFlags8(oldA, getH())
			incPC()
			break
		case 0x85:
			oldA = getA()
			addReg("A", getL())
			setStdAddFlags8(oldA, getL())
			incPC()
			break
		case 0x86:
			oldA = getA()
			addReg("A", getRAMatReg("HL"))
			setStdAddFlags8(oldA, getRAMatReg("HL"))
			incPC()
			break
		case 0x87:
			oldA = getA()
			addReg("A", oldA)
			setStdAddFlags8(oldA, oldA)
			incPC()
			break
		case 0x88:
			//adc a,x
			oldA = getA()
			addReg("A", getB() + getCFlag())
			setStdAddFlags8(oldA, getB() + getCFlag())
			incPC()
			break
		case 0x89:
			oldA = getA()
			addReg("A", getC() + getCFlag())
			setStdAddFlags8(oldA, getC() + getCFlag())
			incPC()
			break
		case 0x8A:
			oldA = getA()
			addReg("A", getD() + getCFlag())
			setStdAddFlags8(oldA, getD() + getCFlag())
			incPC()
			break
		case 0x8B:
			oldA = getA()
			addReg("A", getE() + getCFlag())
			setStdAddFlags8(oldA, getE() + getCFlag())
			incPC()
			break
		case 0x8C:
			oldA = getA()
			addReg("A", getH() + getCFlag())
			setStdAddFlags8(oldA, getH() + getCFlag())
			incPC()
			break
		case 0x8D:
			oldA = getA()
			addReg("A", getL() + getCFlag())
			setStdAddFlags8(oldA, getL() + getCFlag())
			incPC()
			break
		case 0x8E:
			oldA = getA()
			addReg("A", getRAMatReg("HL") + getCFlag())
			setStdAddFlags8(oldA, getRAMatReg("HL") + getCFlag())
			incPC()
			break
		case 0x8F:
			oldA = getA()
			addReg("A", oldA + getCFlag())
			setStdAddFlags8(oldA, oldA + getCFlag())
			incPC()
			break
		case 0x90:
			//sub x
			oldA = getA()
			subReg("A", getB())
			setStdSubFlags8(oldA, getB())
			incPC()
			break
		case 0x91:
			oldA = getA()
			subReg("A", getC())
			setStdSubFlags8(oldA, getC())
			incPC()
			break
		case 0x92:
			oldA = getA()
			subReg("A", getD())
			setStdSubFlags8(oldA, getD())
			incPC()
			break
		case 0x93:
			oldA = getA()
			subReg("A", getE())
			setStdSubFlags8(oldA, getE())
			incPC()
			break
		case 0x94:
			oldA = getA()
			subReg("A", getH())
			setStdSubFlags8(oldA, getH())
			incPC()
			break
		case 0x95:
			oldA = getA()
			subReg("A", getL())
			setStdSubFlags8(oldA, getL())
			incPC()
			break
		case 0x96:
			oldA = getA()
			subReg("A", get())
			setStdSubFlags8(oldA, getB())
			incPC()
			break
		case 0x97:
			oldA = getA()
			subReg("A", getA())
			setStdSubFlags8(oldA, getA())
			incPC()
			break
		case 0x98:
			//sbc a, x
			oldA = getA()
			subReg("A", getB() + getCFlag())
			setStdSubFlags8(oldA, getB() + getCFlag())
			incPC()
			break
		case 0x99:
			oldA = getA()
			subReg("A", getC() + getCFlag())
			setStdSubFlags8(oldA, getC() + getCFlag())
			incPC()
			break
		case 0x9A:
			oldA = getA()
			subReg("A", getD() + getCFlag())
			setStdSubFlags8(oldA, getD() + getCFlag())
			incPC()
			break
		case 0x9B:
			oldA = getA()
			subReg("A", getE() + getCFlag())
			setStdSubFlags8(oldA, getE() + getCFlag())
			incPC()
			break
		case 0x9C:
			oldA = getA()
			subReg("A", getH() + getCFlag())
			setStdSubFlags8(oldA, getH() + getCFlag())
			incPC()
			break
		case 0x9D:
			oldA = getA()
			subReg("A", getL() + getCFlag())
			setStdSubFlags8(oldA, getL() + getCFlag())
			incPC()
			break
		case 0x9E:
			oldA = getA()
			subReg("A", getRAMatReg("HL") + getCFlag())
			setStdSubFlags8(oldA, getRAMatReg("HL") + getCFlag())
			incPC()
			break
		case 0x9F:
			oldA = getA()
			subReg("A", oldA + getCFlag())
			setStdSubFlags8(oldA, oldA + getCFlag())
			incPC()
			break
		case 0xA0:
			//and x
			setA(getA()&getB())
			setStdAndFlags8(getA())
			incPC()
			break
		case 0xA1:
			setA(getA()&getC())
			setStdAndFlags8(getA())
			incPC()
			break
		case 0xA2:
			setA(getA()&getD())
			setStdAndFlags8(getA())
			incPC()
			break
		case 0xA3:
			setA(getA()&getE())
			setStdAndFlags8(getA())
			incPC()
			break
		case 0xA4:
			setA(getA()&getH())
			setStdAndFlags8(getA())
			incPC()
			break
		case 0xA5:
			setA(getA()&getL())
			setStdAndFlags8(getA())
			incPC()
			break
		case 0xA6:
			setA(getA()&getRAMatReg("HL"))
			setStdAndFlags8(getA())
			incPC()
			break
		case 0xA7:
			setA(getA()&getA())
			setStdAndFlags8(getA())
			incPC()
			break
		case 0xA8:
			//xor x
			setA(getA()^getB())
			setStdOrFlags8(getA())
			incPC()
			break
		case 0xA9:
			setA(getA()^getC())
			setStdOrFlags8(getA())
			incPC()
			break
		case 0xAA:
			setA(getA()^getD())
			setStdOrFlags8(getA())
			incPC()
			break
		case 0xAB:
			setA(getA()^getE())
			setStdOrFlags8(getA())
			incPC()
			break
		case 0xAC:
			setA(getA()^getH())
			setStdOrFlags8(getA())
			incPC()
			break
		case 0xAD:
			setA(getA()^getL())
			setStdOrFlags8(getA())
			incPC()
			break
		case 0xAE:
			setA(getA()^getRAMatReg("HL"))
			setStdOrFlags8(getA())
			incPC()
			break
		case 0xAF:
			setA(getA()^getA())
			setStdOrFlags8(getA())
			incPC()
			break
		case 0xB0:
			setA(getA()|getB())
			setStdOrFlags8(getA())
			incPC()
			break
		case 0xB1:
			setA(getA()|getC())
			setStdOrFlags8(getA())
			incPC()
			break
		case 0xB2:
			setA(getA()|getD())
			setStdOrFlags8(getA())
			incPC()
			break
		case 0xB3:
			setA(getA()|getE())
			setStdOrFlags8(getA())
			incPC()
			break
		case 0xB4:
			setA(getA()|getH())
			setStdOrFlags8(getA())
			incPC()
			break
		case 0xB5:
			setA(getA()|getL())
			setStdOrFlags8(getA())
			incPC()
			break
		case 0xB6:
			setA(getA()|getRAMatReg("HL"))
			setStdOrFlags8(getA())
			incPC()
			break
		case 0xB7:
			setA(getA()|getA())
			setStdOrFlags8(getA())
			incPC()
			break
		case 0xB8:
			oldA = getA()
			subReg("A", getB())
			setStdSubFlags8(oldA, getB())
			setA(oldA)
			incPC()
			break
		case 0xB9:
			oldA = getA()
			subReg("A", getC())
			setStdSubFlags8(oldA, getC())
			setA(oldA)
			incPC()
			break
		case 0xBA:
			oldA = getA()
			subReg("A", getD())
			setStdSubFlags8(oldA, getD())
			setA(oldA)
			incPC()
			break
		case 0xBB:
			oldA = getA()
			subReg("A", getE())
			setStdSubFlags8(oldA, getE())
			setA(oldA)
			incPC()
			break
		case 0xBC:
			oldA = getA()
			subReg("A", getH())
			setStdSubFlags8(oldA, getH())
			setA(oldA)
			incPC()
			break
		case 0xBD:
			oldA = getA()
			subReg("A", getL())
			setStdSubFlags8(oldA, getL())
			setA(oldA)
			incPC()
			break
		case 0xBE:
			oldA = getA()
			subReg("A", getRAMatReg("HL"))
			setStdSubFlags8(oldA, getRAMatReg("HL"))
			setA(oldA)
			incPC()
			break
		case 0xBF:
			oldA = getA()
			subReg("A", oldA)
			setStdSubFlags8(oldA, oldA)
			setA(oldA)
			incPC()
			break
		case 0xC0:
			//ret nz
			if (!getCFlag()) {
				setPC(popStack())
			} else {
				incPC()
			}
			break
		case 0xC1:
			//pop bc
			set16reg("BC", popStack())
			incPC()
			break
		case 0xC2:
			//jp nz,**
			if (!getZFlag()) {
				setPC(make16(getP1(), getP2()))
			} else {
				addPC(3)
			}
			break
		case 0xC3:
			//jp **
			setPC(make16(getP1(), getP2()))
			eResult.isJump = true
			break
		case 0xC4:
			//call nz,**
			if (!getZFlag()) {
				pushStack((getPC() + 3) % 65536)
				setPC(make16(getP1(), getP2()))
			} else {
				addPC(3)
			}
			break
		case 0xC5:
			//push bc
			pushStack(getBC())
			incPC()
			break
		case 0xC6:
			//add a,*
			oldA = getA()
			addReg("A", getP1())
			setStdAddFlags8(oldA, getP1())
			addPC(2)
			break
		case 0xC7:
			//rst 00h
			pushStack((getPC() + 1) % 65536)
			setPC(0)
			break
		case 0xC8:
			//ret z
			if (getZFlag()) {
				setPC(popStack())
				eResult.isJump = true
			} else {
				incPC()
			}
			break
		case 0xC9:
			//ret
			setPC(popStack())
			break
		case 0xCA:
			//jp z,**
			if (getZFlag()) {
				setPC(make16(getP1(), getP2()))
			} else {
				addPC(3)
			}
			break
		case 0xCC:
			//call z,**
			if (getZFlag()) {
				pushStack((getPC() + 3) % 65536)
				setPC(make16(getP1(), getP2()))
			} else {
				addPC(3)
			}
			break
		case 0xCD:
			//call **
			pushStack((getPC() + 3) % 65536)
			setPC(make16(getP1(), getP2()))
			eResult.isJump = true
			break
		case 0xCE:
			//adc a,*
			oldA = getA()
			addReg("A", getP1() + getCFlag())
			setStdAddFlags8(oldA, getP1() + getCFlag())
			addPC(2)
			break
		case 0xCF:
			//rst 08h
			pushStack((getPC() + 1) % 65536)
			setPC(8)
			break
		case 0xD0:
			//ret nc
			if (!getCFlag()) {
				setPC(popStack())
			} else {
				incPC()
			}
			break
		case 0xD1:
			//pop de
			set16reg("DE", popStack())
			incPC()
			break
		case 0xD2:
			//jp nc,**
			if (!getCFlag()) {
				setPC(make16(getP1(), getP2()))
			} else {
				addPC(3)
			}
			break
		case 0xD3:
			//out (*),a
			handlePortWrite(getP1(), getA())
			addPC(2)
			break
		case 0xD4:
			//call nc,**
			if (!getCFlag()) {
				pushStack((getPC() + 3) % 65536)
				setPC(make16(getP1(), getP2()))
			} else {
				addPC(3)
			}
			break
		case 0xD5:
			//push de
			pushStack(getDE())
			incPC()
			break
		case 0xD6:
			//sub *
			oldA = getA()
			subReg("A", getP1())
			setStdSubFlags8(oldA, getP1())
			addPC(2)
			break
		case 0xD7:
			//rst 10h
			pushStack((getPC() + 1) % 65536)
			setPC(0x10)
			incPC()
			break
		case 0xD8:
			//ret c
			if (getCFlag()) {
				setPC(popStack())
			} else {
				incPC()
			}
			break
		case 0xD9:
			//exx
			swapAllShad()
			incPC()
			break
		case 0xDA:
			//jp c,**
			if (getCFlag()) {
				setPC(make16(getP1(), getP2()))
			} else {
				addPC(3)
			}
			break
		case 0xDB:
			//in a,(*)
			//yeah uhhh
			addPC(2)
			break
		case 0xDC:
			//call c,**
			if (getCFlag()) {
				pushStack((getPC() + 3) % 65536)
				setPC(make16(getP1(), getP2()))
			} else {
				addPC(3)
			}
			break
		case 0xE5:
			//push hl
			pushStack(getHL())
			incPC()
			break
		case 0xF1:
			//pop af
			set16reg("AF", popStack())
			incPC()
			break
		case 0xF5:
			//push af
			pushStack(getAF())
			incPC()
			break
		case 0xFE:
			//cp *
			setStdSubFlags8(getA(), getP1())
			addPC(2)
			break
		case 0xCB:
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
						setZFlag(getBit(getRAMatReg("HL"), bit))
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
						setRAMatReg("HL", resetBit(getRAMatReg("HL"), bit))
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
						setRAMatReg("HL", setBit(getRAMatReg("HL"), bit))
					//if normal register
					} else {
						//resets specified bit of target reg
						setReg(target, setBit(getReg(target), bit))
					}
				}

			}
		case 0xDD:
			break
		case 0xED:
			break
		case 0xFD:
			break

	}

	return eResult
}