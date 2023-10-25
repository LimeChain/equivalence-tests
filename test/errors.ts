import { expect } from 'chai'
import { ethers } from 'hardhat'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('Solidity Errors', function () {
  let contract: any, hasError: boolean, wallet, contractExternal: any

  before(async function () {
    const signers = await ethers.getSigners()
    wallet = signers[0]
    const factoryErrorsExternal = await ethers.getContractFactory('contracts/ErrorsExternal.sol:ErrorsExternal')
    contractExternal = await factoryErrorsExternal.deploy({gasLimit: 5_000_000})

    const factory = await ethers.getContractFactory('contracts/Errors.sol:Errors')
    const addr = contractExternal.target
    contract = await factory.deploy(addr, {gasLimit: 5_000_000})

    await sleep(2000);
  })

  beforeEach(async function () {
    hasError = false
  })

  xit('should confirm assert works', async function () {
    try {
      const res = await contract.assertCheck(1 == 1)
      expect(res).to.equal(true)

      await contract.assertCheck(1 > 1)
    } catch (err) {
        hasError = true
        expect(err).to.exist
    }
    expect(hasError).to.equal(true)
  })

  xit('should confirm require works', async function () {
    try {
        const resReverted = await contract.requireCheck(true)
        expect(resReverted).to.equal(true)
  
        await contract.requireCheck(false)
      } catch (err) {
          hasError = true
          expect(err).to.exist
      }
      expect(hasError).to.equal(true)
  })

  xit('should confirm revert works', async function () {
    try {
        await contract.revertCheck()
    } catch (err) {
        hasError = true
        expect(err).to.exist
    }
    expect(hasError).to.equal(true)
  })

  xit('should confirm revert with message works', async function () {
    const message = "We unfortunalty need to revert this transaction"
    try {
        await contract.revertWithMessageCheck(message)
    } catch (err: any) {
        hasError = true
        expect(err.reason).to.exist
        expect(err.reason).to.equal(message)
    }
    expect(hasError).to.equal(true)
  })

  it('should confirm revert with custom error works', async function () {
    try {
      await contract.revertWithCustomError()
    } catch (err: any) {
        hasError = true
        expect(err.code).to.equal('CALL_EXCEPTION')
        expect(err.errorName).to.equal('InsufficientBalance')
        // expect(err.errorArgs.available).to.equal(ethers.BigNumber.from(1))
        // expect(err.errorArgs.required).to.equal(ethers.BigNumber.from(100))
    }
    expect(hasError).to.equal(true)
  })

  // xit('should confirm revert with custom error payable works', async function () {
  //   try {
  //     const value = ethers.BigNumber.from(10_000_000_000)
  //     const gasLimit = ethers.BigNumber.from(10_000_000)
  //     const tx = await contract.revertWithCustomErrorPayable({value, gasLimit})
  //     const rec = await tx.wait()
  //     //console.log(res)
  //   } catch (err: any) {
  //       hasError = true
  //       expect(err.code).to.equal('CALL_EXCEPTION')
  //       expect(err.errorName).to.equal('InsufficientBalance')
  //       expect(err.errorArgs.available).to.equal(ethers.BigNumber.from(1))
  //       expect(err.errorArgs.required).to.equal(ethers.BigNumber.from(100))
  //   }
  //   expect(hasError).to.equal(true)
  // })

  xit('should confirm try/catch with simple revert', async function () {
      const tx = await contract.tryCatchWithSimpleRevert()
      const receipt = await tx.wait()
      expect(receipt).to.exist
      expect(receipt.events[0].args.code).to.equal(0)
      expect(receipt.events[0].args.message).to.equal('revertSimple')
  })

  xit('should confirm try/catch revert with error message', async function () {
    const message = "We unfortunalty need to revert this transaction"
    const tx = await contract.tryCatchWithErrorMessageRevert(message)
    const receipt = await tx.wait()
    expect(receipt).to.exist
    expect(receipt.events[0].args.code).to.equal(0)
    expect(receipt.events[0].args.message).to.equal(message)
  })

  xit('should confirm try/catch revert with panic', async function () {
    const tx = await contract.tryCatchWithPanic()
    const receipt = await tx.wait()
    expect(receipt).to.exist
    expect(receipt.events[0].args.code).to.equal(18)
    expect(receipt.events[0].args.message).to.equal('panic')
  })

})
