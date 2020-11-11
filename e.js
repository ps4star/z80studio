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
			setRAM(getRAMatReg("BC"), getA())
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
			add16reg("HL", get16reg("BC"))
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
			incPC()
			break
		case 0x0C:
			//inc c
			addReg("C", 0x01)
			incPC()
			break
		case 0x0D:
			//dec c
			subReg("C", 0x01)
			incPC()
			break
		case 0x0E:
			//ld c,*
			setC(getP1())
			addPC(2)
			break
		case 0x0F:
			//rrca
			setAFlag(0)
			setHFlag(0)

			//stores bit 0 so it can be set to bit 7 later
			let bit0 = getBit(getA(), 0)
			setCFlag(bit0)

			//performs right bitshift on A
			setA(parseInt(bit0.toString() + lzfill(getA().toString(2), 8).slice(0, 7), 2))
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
			incPC()
			break
		case 0x14:
			//inc d
			addReg("D", 0x01)
			incPC()
			break
		case 0x15:
			//dec d
			subReg("D", 0x01)
			incPC()
			break
		case 0x16:
			break
		case 0x17:
			break
		case 0x18:
			break
		case 0x23:
			//inc hl
			add16reg("HL", 0x01)
			incPC()
			break
		case 0x2F:
			//cpl
			setA(inv8bit(getA()))
			incPC()
			break
		case 0x33:
			//inc sp
			addSP(0x01)
			incPC()
			break
		case 0x3E:
			//ld a,*
			setA(getP1())
			addPC(2)
			break
		case 0xC3:
			//jp **
			setPC(make16(getP1(), getP2()))
			eResult.isJump = true
			break
		case 0xFE:
			//cp *
			setAFlag(1)
			let diff = getA() - getP1()
			if (diff == 0) {
				setZFlag(1)
			} else {
				setZFlag(0)
			}
			
			addPC(2)
			break
	}

	return eResult
}