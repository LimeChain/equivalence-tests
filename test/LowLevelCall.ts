import {expect} from "chai";
import {ethers} from 'hardhat';

describe('EVM Calls and internal calls edge cases test', function() {

  let CallerFactory: any;
  let LowLevelReceiverFactory: any;
  let callerContract: any;
  let receiverContract: any;
  let receiverAddress: string;
  let callerAddress: string;

  const zeroAddress = '0x0000000000000000000000000000000000000000';
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  before(async () => {

    CallerFactory = await ethers.getContractFactory("contracts/LowLevelCall.sol:Caller");
    LowLevelReceiverFactory = await ethers.getContractFactory("contracts/LowLevelCall.sol:LowLevelReceiver");

    callerContract = await CallerFactory.deploy({gasLimit: 5_000_000});
    receiverContract = await LowLevelReceiverFactory.deploy({gasLimit: 5_000_000});
    
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
    const randAddress = getRandomEthereumAddress();

    const tx = await owner.sendTransaction({
      to: randAddress,
      value: ethers.parseEther("10")
    });

    console.log("tx hash: ", tx.hash);

  });

  // EOA -calls-> Non-existing contract
  it('should be able to make a top-level CALL to a non-existing contract', async function() {

    const randAddress = getRandomEthereumAddress();

    const fakeCaller = CallerFactory.attach(randAddress);

    const tx = await fakeCaller.testCallFoo(receiverAddress, {gasLimit: 1000000});
    
    console.log("tx hash: ", tx.hash);

    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  // EOA -calls-> Non-existing function of an existing contract, resulting in the fallback function of the contract being called
  it('should be able to make a top-level CALL to a non-existing function of an existing contract', async function() {

    // attaching the receiver contract to the caller contract factory will try to call the function testCallFoo that does not exist
    const fakeCaller = CallerFactory.attach(receiverAddress);

    const tx = await fakeCaller.testCallFoo(receiverAddress);
    
    console.log("tx hash: ", tx.hash);

    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  // EAO -calls-> Caller -calls-> Receiver
  it('should be able to make an internal CALL to an existing contract', async function() {

    const tx = await callerContract.testCallFoo(receiverAddress, {
      value: ethers.parseEther("10")
    });

    console.log("tx hash: ", tx.hash);
    
    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  // EAO -calls-> Caller -calls-> Non-existing contract
  it('should be able to make an internal CALL to a non-existing contract', async function() {

    const randAddress = getRandomEthereumAddress();

    console.log("generated randAddress: ", randAddress);

    const tx = await callerContract.testCallFoo(randAddress);

    console.log("tx hash: ", tx.hash);

    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);

  });

  // EAO -call w value-> Caller -call w value-> Non-existing contract
  it('should be able to make an internal CALL WITH VALUE to a non-existing contract', async function() {

    const randAddress = getRandomEthereumAddress();

    console.log("generated randAddress: ", randAddress);

    const tx = await callerContract.testCallFoo(randAddress, {
      value: ethers.parseEther("10")
    });

    console.log("tx hash: ", tx.hash);

    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);

  });

  it('should be able to make a call with value to incorrect ABI via nested contract call', async function() {
    // attaching the receiver contract to the caller contract factory will try to call the function testCallFooWithWrongAbi and pass value
    const fakeCaller = CallerFactory.attach(callerAddress);

    const tx = await fakeCaller.testCallFooWithWrongAbi(receiverAddress, {value: ethers.parseEther("1")});
    
    console.log("tx hash: ", tx.hash);

    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  it('should be able to make a call to incorrect ABI via nested contract call', async function() {
    // attaching the receiver contract to the caller contract factory will try to call the function testCallFooWithWrongAbi
    const fakeCaller = CallerFactory.attach(callerAddress);

    const tx = await fakeCaller.testCallFooWithWrongAbi(receiverAddress);
    
    console.log("tx hash: ", tx.hash);

    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  it('should be able to make a contract TRANSFER to a non-existing contract', async function() {

    const randAddress = getRandomEthereumAddress();

    const tx = await callerContract.testTransfer(randAddress, {gasLimit: 1000000});

    console.log("tx hash: ", tx.hash);
    
    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  it('should be able to make a contract SEND to a non-existing contract', async function() {

    const randAddress = getRandomEthereumAddress();

    const tx = await callerContract.testSend(randAddress, {value: 1000000});

    console.log("tx hash: ", tx.hash);
    
    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  it('should be able to make a contract CALL WITH VALUE to a non-existing contract', async function() {

    const randAddress = getRandomEthereumAddress();

    const tx = await callerContract.testCallDoesNotExist(randAddress, {value: ethers.parseEther("10")});

    console.log("tx hash: ", tx.hash);
    
    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  // This test is not working as expected because the local besu node does not return the logs in the tx receipt
  it('should confirm valid contract via tx', async function() {

    const tx = await callerContract.isContractTx(receiverAddress);

    const rc = await tx.wait();

    console.log(rc);

    const responseEvent = rc.events?.find((event: any) => event.event === "Response");

    expect(responseEvent).to.not.be.eq(undefined);
    expect(responseEvent?.args!.success).to.be.eq(true);

  });

  // This test is not working as expected because the local besu node does not return the logs in the tx receipt
  it('should confirm invalid contract via tx', async function() {

    const tx = await callerContract.isContractTx(invalidAddress);

    const rc = await tx.wait();

    const responseEvent = rc.events?.find((event: any) => event.event === "Response");

    expect(responseEvent).to.not.be.eq(undefined);
    expect(responseEvent?.args!.success).to.be.eq(false);

  });

  it('should be able to make an internal VIEW CALL on a valid receiver', async function() {

    const result = await callerContract.testCallViewCall.staticCall(receiverAddress);
    
    expect(result?.success).to.be.eq(true);

    console.log("result: ", result);
  });

  it('should ALSO be able to make an internal VIEW CALL on a INVALID receiver', async function() {

    const randAddress = getRandomEthereumAddress();

    const result = await callerContract.testCallViewCall.staticCall(randAddress);
    
    expect(result?.success).to.be.eq(true);

  });

  it('should confirm valid contract', async function() {

    const result = await callerContract.isContract(receiverAddress);
    
    expect(result).to.be.eq(true);

  });

  it('should confirm invalid contract', async function() {

    const randAddress = getRandomEthereumAddress();

    const result = await callerContract.isContract(randAddress);
    
    expect(result).to.be.eq(false);

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
