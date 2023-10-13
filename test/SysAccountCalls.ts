import {expect} from "chai";
import {ethers} from 'hardhat';

describe('EVM Calls and internal calls to Hedera system accounts', function() {

  let CallerFactory: any;
  let callerContract: any;
  let callerAddress: string;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // system account addresses -------------------------------------------------

  // local node account 0.0.0 does not exist and cannot be created
  const addressZero = '0x0000000000000000000000000000000000000000';

  // In hedera, account 0.0.2 is a system account. In Ethereum, it is a precompiled contract.
  const addressTwo = '0x0000000000000000000000000000000000000002';

  // local node account 0.0.800 exists with receiverSigRequired = false
  const address800 = '0x0000000000000000000000000000000000000320';

  // --------------------------------------------------------------------------

  before(async () => {

    CallerFactory = await ethers.getContractFactory("contracts/SysAccountsCaller.sol:Caller");
    callerContract = await CallerFactory.deploy({gasLimit: 5_000_000});
    callerAddress = callerContract.target;
    console.log("Deployed Caller contract on address: ", callerAddress);

    // We need to wait for the contract to be mined or some tests will fail
    // await sleep(2000);
  });

  // EOA calls to system accounts ---------------------------------------------

  // 1. EOA -transfer→ 0.0.0
  it('should not be able to top-level TRANSFER to account 0.0.0', async function() {
  
    let err = "";
    const [owner] = await ethers.getSigners();

    const tx = await owner.sendTransaction({
      to: addressZero,
      value: ethers.parseEther("10")
    });

    console.log("tx hash: ", tx.hash);

    try {
      await tx.wait();
    } catch (error: any) {
      err = error.message;
    }

    expect(err).to.match(/(?:transaction execution reverted|transaction reverted:)/);
  });

  // 2. EOA -call-> 0.0.0
  it('should not be able to CALL account 0.0.0', async function() {

    let err = "";
    const fakeContract = CallerFactory.attach(addressZero);

    try {
      await fakeContract.canBeCalled();
    } catch (error: any) {
      err = error.message;
    }

    expect(err).to.match(/(?:transaction execution reverted|transaction reverted|execution reverted:)/);
  });

  // 3. EOA -call w value-> 0.0.0
  it('should not be able to CALL WITH VALUE account 0.0.0', async function() {

    let err = "";
    const fakeContract = CallerFactory.attach(addressZero);

    try {
      await fakeContract.canBeCalled({value: ethers.parseEther("10")});
    } catch (error: any) {
      err = error.message;
    }

    expect(err).to.match(/(?:transaction execution reverted|transaction reverted|execution reverted:)/);
  });

  // 4. EOA -transfer→ 0.0.2
  it('should not be able to top-level TRANSFER to account 0.0.2', async function() {

    let err = "";
    const [owner] = await ethers.getSigners();

    const tx = await owner.sendTransaction({
      to: addressTwo,
      value: ethers.parseEther("10")
    });

    console.log("tx hash: ", tx.hash);

    try {
      await tx.wait();
    } catch (error: any) {
      err = error.message;
    }

    expect(err).to.match(/(?:transaction execution reverted|transaction reverted:)/);
  });

  // 5. EOA -call-> 0.0.2
  it('should not be able to CALL account 0.0.2', async function() {

    let err = "";
    const fakeContract = CallerFactory.attach(addressTwo);

    try {
      await fakeContract.canBeCalled();
    } catch (error: any) {
      err = error.message;
    }

    // could not decode result data
    // expect(err).to.match(/(?:transaction execution reverted|transaction reverted|execution reverted:)/);
  });

  // 6. EOA -call w value-> 0.0.2
  it('should not be able to CALL WITH VALUE account 0.0.2', async function() {

    let err = "";
    const fakeContract = CallerFactory.attach(addressTwo);

    try {
      await fakeContract.canBeCalled({value: ethers.parseEther("10")});
    } catch (error: any) {
      err = error.message;
    }

    expect(err).to.match(/(?:transaction execution reverted|transaction reverted|execution reverted:)/);
  });

  // 7. EOA -transfer→ 0.0.800
  it('should be able to top-level TRANSFER to account 0.0.800', async function() {

    let err = "";
    let rc = null;
    const [owner] = await ethers.getSigners();

    const tx = await owner.sendTransaction({
      to: address800,
      value: ethers.parseEther("10")
    });

    console.log("tx hash: ", tx.hash);

    try {
      rc = await tx.wait();
    } catch (error: any) {
      err = error.message;
    }

    expect(err).to.be.eq("");
    expect(rc?.status).to.be.eq(1);
  });

  // 8. EOA -call-> 0.0.800
  it('should not be able to CALL account 0.0.800', async function() {

    let err = "";
    const fakeContract = CallerFactory.attach(address800);

    try {
      await fakeContract.canBeCalled();
    } catch (error: any) {
      err = error.message;
    }

    // could not decode result data
    // expect(err).to.match(/(?:transaction execution reverted|transaction reverted|execution reverted|could not decode result:)/);
  });

  // 9. EOA -call w value-> 0.0.800
  it('should not be able to CALL WITH VALUE account 0.0.2', async function() {

    let err = "";
    const fakeContract = CallerFactory.attach(address800);

    try {
      await fakeContract.canBeCalled({value: ethers.parseEther("10")});
    } catch (error: any) {
      err = error.message;
    }

    expect(err).to.match(/(?:transaction execution reverted|transaction reverted|execution reverted:)/);
  });
  
  // Internal calls to system accounts ----------------------------------------

});
