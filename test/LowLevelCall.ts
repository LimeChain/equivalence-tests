import { expect } from "chai";
import { Contract } from 'ethers';
import {ethers} from 'hardhat';

// type SuccessPromiseSettledResults = PromiseSettledResult<Contract>[]
type SuccessContractPromiseSettledResults = {
  status: string,
  value: Contract
}[];

const SettledStatus = {
  fulfilled: "fulfilled",
  rejected: "rejected"
};

describe('EVM Calls and internal calls edge cases test', function() {

  let CallerFactory: any;
  let LowLevelReceiverFactory: any;
  let callerContract: any;
  let receiverContract: any;
  let receiverAddress: string;
  let callerAddress: string;

  const invalidAddress = '0xd9145CCE52D386f254917e481eB44e9943F39138';
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  const nonExistentAddress = "0x0004324324324234234234234234234234234234";
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  before(async () => {

    CallerFactory = await ethers.getContractFactory("contracts/LowLevelCall.sol:Caller");
    LowLevelReceiverFactory = await ethers.getContractFactory("contracts/LowLevelCall.sol:LowLevelReceiver");

    callerContract = await CallerFactory.deploy();
    receiverContract = await LowLevelReceiverFactory.deploy();
    
    callerAddress = callerContract.target;
    receiverAddress = receiverContract.target;

    console.log("Deployed Caller contract on address: ", callerAddress);
    console.log("Deployed LowLevelReceiver contract on address: ", receiverAddress);

    // We need to wait for the contracts to be mined or some tests will fail
    await sleep(3000);
  });

  it('should be able to top-level TRANSFER to an EXISTING account', async function() {
    
    const [owner, operator] = await ethers.getSigners();
    const tx = await owner.sendTransaction({
      to: operator.address,
      value: ethers.parseEther("10")
    });

    console.log("tx hash: ", tx.hash);

  });

  it('should be able to top-level TRANSFER to a NON-EXISTING account', async function() {
    
    const [owner] = await ethers.getSigners();
    const tx = await owner.sendTransaction({
      to: nonExistentAddress,
      value: ethers.parseEther("10")
    });

    console.log("tx hash: ", tx.hash);

  });

  it('should be able to make a top-level CALL to a non-existing contract', async function() {

    const fakeCaller = CallerFactory.attach(invalidAddress);

    const tx = await fakeCaller.testCallFoo(receiverAddress, {gasLimit: 1000000});
    
    console.log("tx hash: ", tx.hash);

    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  it('should be able to make a top-level CALL to a non-existing function of an existing contract', async function() {

    // attaching the receiver contract to the caller contract factory will try to call the function testCallFoo that does not exist
    const fakeCaller = CallerFactory.attach(receiverAddress);

    const tx = await fakeCaller.testCallFoo(receiverAddress);
    
    console.log("tx hash: ", tx.hash);

    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  it('should be able to make an internal CALL to an existing contract', async function() {

    const tx = await callerContract.testCallFoo(receiverAddress);

    console.log("tx hash: ", tx.hash);
    
    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  it('should be able to make an internal CALL to a non-existing contract', async function() {

    const tx = await callerContract.testCallFoo(invalidAddress);

    console.log("tx hash: ", tx.hash);

    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);

  });

  it('should be able to make an internal VIEW CALL on a valid receiver', async function() {

    const result = await callerContract.testCallViewCall.staticCall(receiverAddress);
    
    expect(result?.success).to.be.eq(true);

    console.log("result: ", result);
  });

  it('should ALSO be able to make an internal VIEW CALL on a INVALID receiver', async function() {

    const result = await callerContract.testCallViewCall.staticCall(invalidAddress);
    
    expect(result?.success).to.be.eq(true);

  });

  it('should confirm valid contract', async function() {

    const result = await callerContract.isContract(receiverAddress);
    
    expect(result).to.be.eq(true);

  });

  it('should confirm invalid contract', async function() {

    const result = await callerContract.isContract(invalidAddress);
    
    expect(result).to.be.eq(false);

  });

  // This test is not working as expected because the local besu node does not return the logs in the tx receipt
  xit('should confirm valid contract via tx', async function() {

    const tx = await callerContract.isContractTx(receiverAddress);

    const rc = await tx.wait();

    console.log(rc);

    const responseEvent = rc.events?.find((event: any) => event.event === "Response");

    expect(responseEvent).to.not.be.eq(undefined);
    expect(responseEvent?.args!.success).to.be.eq(true);

  });

  // This test is not working as expected because the local besu node does not return the logs in the tx receipt
  xit('should confirm invalid contract via tx', async function() {

    const tx = await callerContract.isContractTx(invalidAddress);

    const rc = await tx.wait();

    const responseEvent = rc.events?.find((event: any) => event.event === "Response");

    expect(responseEvent).to.not.be.eq(undefined);
    expect(responseEvent?.args!.success).to.be.eq(false);

  });

});
