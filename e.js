//RAM execution script
function getNextByte() {
	//gets RAM byte pointed to by PC
	return sys.RAM[sys.PC]
}

function getP1() {
	//returns byte after PC
	return sys.RAM[sys.PC+1]
}

function getP2() {
	//returns 2 bytes after PC
	return sys.RAM[sys.PC+2]
}

function setPC(n) {
	sys.PC = n
}

function addPC(n) {
	sys.PC += n
}

function incPC() {
	sys.PC++
}

function exec() {
	//data for step mode
	let eResult = {
		isJump : false
	}

	//loads opcode from RAM (PC)
	let opcode = getNextByte()

	//execute instruction
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
			setRAM(getRAMatBC(), getA())
			incPC()
			break
		case 0x03:
			//inc bc
			add16reg("BC", 0x01)
			incPC()
			break
		case 0x04:
			//inc b
			addReg("B", 0x01)
			incPC()
			break
		case 0x05:
			//dec b
			subReg("B", 0x01)
			incPC()
			break
		case 0x06:
			//ld b,*
			setB(getP1())
			addPC(2)
			break
		case 0x07:
			//rlca
			setAFlag(0)
			setHFlag(0)

			//stores bit 7 so it can be set to bit 0 later
			let bit7 = getBit(getA(), 7)
			setCFlag(bit7)

			//performs left bitshift on A
			setA(parseInt(lzfill(getA().toString(2), 8).slice(1) + bit7.toString(), 2))
			break
		case 0x08:
			//ex af,af'
			break
		case 0x09:
			break
		case 0x0A:
			break
		case 0x0B:
			break
		case 0x0C:
			break
		case 0x0D:
			break
		case 0x0E:
			break
		case 0x0F:
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
			break
		case 0x12:
			break
		case 0x13:
			break
		case 0x14:
			break
		case 0x15:
			break
		case 0x16:
			break
		case 0x17:
			break
		case 0x18:
			break
		case 0x33:
			//inc sp
			addSP(0x01)
			break
		case 0x3E:
			//ld a,*
			setA(getP1())
			addPC(2)
			break
		case 0xC3:
			//jp **
			setPC(hexToInt(intToHex(getP1()) + intToHex(getP2())))
			eResult.isJump = true
			break
	}

	return eResult
}