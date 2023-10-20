import {expect} from "chai";
import {ethers} from 'hardhat';

describe('EOA direct calls scenarios', function() {

  let SimpleContractFactory: any;
  const address0x0 = '0x0000000000000000000000000000000000000000';
  const address0x2 = '0x0000000000000000000000000000000000000002';

  before(async () => {
    SimpleContractFactory = await ethers.getContractFactory("contracts/SimpleContract.sol:SimpleContract");
  });

  // 1. EOA -call→ 0x0 (0.0.0)
  it('should be able to make a CALL to address 0x0', async function() {

    const addressCaller = SimpleContractFactory.attach(address0x0);
    let error: any;
    let staticCallResult: any;

    const tx = await addressCaller.simpleFunction();
    const rc = await tx.wait();

    console.log("tx hash: ", tx.hash);
    expect(rc.status).to.be.eq(1);
    
    try {
      // Make a static call to the same function to get the return value
      staticCallResult = await addressCaller.simpleFunction.staticCall();
    } catch (e: any) {
      error = e;
    }

    expect(error.message).to.match(/(?:could not decode result data|value=:)/);
  });

  // 2. EOA -call→ 0x2 (0.0.2)
  it('should be able to make a CALL to address 0x2', async function() {

    const addressCaller = SimpleContractFactory.attach(address0x2);
    const input = ethers.encodeBytes32String("bytes32");
    let error: any;
    let staticCallResult: any;

    const tx = await addressCaller.simpleBytesFunction(input);
    const rc = await tx.wait();

    console.log("tx hash: ", tx.hash);
    expect(rc.status).to.be.eq(1);

    try {
      // Make a static call to the same function to get the return value
      staticCallResult = await addressCaller.simpleBytesFunction.staticCall(input);
    } catch (e: any) {
      error = e;
    }
    
    console.log("staticCallResult: ", staticCallResult);
    // this proves that the precompiled contract at address 0x2 is called!
    expect(error).to.be.undefined;
  });

  function getRandomEthereumAddress(): string {
    const length: number = 40;
    const number: string = [...Array(length)]
      .map(() => {
        return Math.floor(Math.random() * 16).toString(16);
      })
      .join("");
    return "0x" + number;
  }
});
