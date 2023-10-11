import {expect} from "chai";
import {ethers} from 'hardhat';

describe('EVM Calls and internal calls edge cases test', function() {

  let CallerFactory: any;
  let LowLevelReceiverFactory: any;
  let NonPayableContractFactory: any;
  let RejectingPaymentsContractFactory: any;
  let callerContract: any;
  let receiverContract: any;
  let nonPayableContract: any;
  let rejectingPaymentsContract: any;
  let receiverAddress: string;
  let callerAddress: string;
  let nonPayableContractAddress: string;
  let rejectingPaymentsContractAddress: string;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  before(async () => {

    CallerFactory = await ethers.getContractFactory("contracts/LowLevelCall.sol:Caller");
    LowLevelReceiverFactory = await ethers.getContractFactory("contracts/LowLevelCall.sol:LowLevelReceiver");
    NonPayableContractFactory = await ethers.getContractFactory("contracts/NonPayableContract.sol:NonPayableContract");
    RejectingPaymentsContractFactory = await ethers.getContractFactory("contracts/NonPayableContract.sol:RejectingPaymentsContract");

    callerContract = await CallerFactory.deploy({gasLimit: 5_000_000});
    receiverContract = await LowLevelReceiverFactory.deploy({gasLimit: 5_000_000});
    nonPayableContract = await NonPayableContractFactory.deploy({gasLimit: 5_000_000});
    rejectingPaymentsContract = await RejectingPaymentsContractFactory.deploy({gasLimit: 5_000_000});
    
    callerAddress = callerContract.target;
    receiverAddress = receiverContract.target;
    nonPayableContractAddress = nonPayableContract.target;
    rejectingPaymentsContractAddress = rejectingPaymentsContract.target;

    console.log("Deployed Caller contract on address: ", callerAddress);
    console.log("Deployed LowLevelReceiver contract on address: ", receiverAddress);
    console.log("Deployed NonPayableContract contract on address: ", nonPayableContractAddress);
    console.log("Deployed RejectingPaymentsContract contract on address: ", rejectingPaymentsContractAddress);

    // We need to wait for the contracts to be mined or some tests will fail
    await sleep(2000);
  });

  // 1. EOA -transfer→ EOA2, where EOA2 exists.
  it('should be able to top-level TRANSFER to an EXISTING account', async function() {
    
    const [owner, operator] = await ethers.getSigners();
    const tx = await owner.sendTransaction({
      to: operator.address,
      value: ethers.parseEther("10")
    });

    console.log("tx hash: ", tx.hash);

  });

  // 2. EOA -transfer→ EOA2, where EOA2 doesn’t exist.
  it('should be able to top-level TRANSFER to a NON-EXISTING account', async function() {
    
    const [owner] = await ethers.getSigners();
    const randAddress = getRandomEthereumAddress();

    const tx = await owner.sendTransaction({
      to: randAddress,
      value: ethers.parseEther("10")
    });

    console.log("tx hash: ", tx.hash);
  });

  // 3. EOA -call function f→ Contract, where Contract doesn’t exist on the address that’s called.
  it('should be able to make a top-level CALL to a non-existing contract', async function() {

    const randAddress = getRandomEthereumAddress();

    const fakeCaller = CallerFactory.attach(randAddress);

    const tx = await fakeCaller.testCallFoo(receiverAddress, {gasLimit: 1000000});
    
    console.log("tx hash: ", tx.hash);

    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  // 4. EOA -call function f→ Contract, where Contract does exist on the address that’s called, but f doesn’t exist as a function in the contract.
  it('should be able to make a top-level CALL to a non-existing function of an existing contract', async function() {

    // attaching the receiver contract to the caller contract factory will try to call the function testCallFoo that does not exist
    const fakeCaller = CallerFactory.attach(receiverAddress);

    const tx = await fakeCaller.testCallFoo(receiverAddress);
    
    console.log("tx hash: ", tx.hash);

    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  // 5. EOA -call→ Caller -call function f of→ Receiver, where Receiver exists and f exists.
  it('should be able to make an internal CALL to an existing contract', async function() {

    const tx = await callerContract.testCallFoo(receiverAddress, {
      value: ethers.parseEther("10")
    });

    console.log("tx hash: ", tx.hash);
    
    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  // 6. EOA -call→ Caller -call→ Receiver, where Receiver doesn’t exist.
  it('should be able to make an internal CALL to a non-existing contract', async function() {

    const randAddress = getRandomEthereumAddress();

    console.log("generated randAddress: ", randAddress);

    const tx = await callerContract.testCallFoo(randAddress);

    console.log("tx hash: ", tx.hash);

    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);

  });

  // 7. & 8. EOA -call→ Caller -call w value→ Receiver, where Receiver doesn’t exist; change the gas limit forwarded to the receiver in the contract to test with 20k/600k.
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

  // 9. EOA -call→ Caller -call function f→ Receiver, where Receiver does exist, but f doesn’t exist as a function in the contract.
  it('should be able to make an internal CALL to a non-existing function of an existing contract', async function() {

    const tx = await callerContract.testCallDoesNotExist(receiverAddress);
    
    console.log("tx hash: ", tx.hash);

    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  // 10. EOA -call w value→ Caller -call w value function f→ Receiver, where Receiver does exist, but f doesn’t exist as a function in the contract.
  it('should be able to make an internal CALL WITH VALUE to a non-existing function of an existing contract', async function() {

    const tx = await callerContract.testCallDoesNotExist(receiverAddress, {value: ethers.parseEther("10")});
    
    console.log("tx hash: ", tx.hash);

    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  // 11. EOA -call→ Caller -transfer→ NonExistingContract
  it('should be able to make an internal TRANSFER to a non-existing contract', async function() {

    const randAddress = getRandomEthereumAddress();

    const tx = await callerContract.testTransfer(randAddress, {gasLimit: 1000000});

    console.log("tx hash: ", tx.hash);
    
    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  // 12. EOA -call→ Caller -send→ NonExistingContract
  it('should be able to make an internal SEND to a non-existing contract', async function() {

    const randAddress = getRandomEthereumAddress();

    const tx = await callerContract.testSend(randAddress, {value: 1000000});

    console.log("tx hash: ", tx.hash);
    
    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  // 13. EOA -transfer→ EOA2, where EOA tries to transfer more than its balance
  it('should not be able to top-level TRANSFER more than the available account balance', async function() {
  
    let wallet = ethers.Wallet.createRandom();
    let err = "";
    let tx = null;

    const [owner] = await ethers.getSigners();
    const signer = wallet.connect(ethers.provider);

    await owner.sendTransaction({
      to: wallet.address,
      value: ethers.parseEther("10")
    });

    try {
      tx = await signer.sendTransaction({
      to: owner.address,
      value: ethers.parseEther("11")
      });

      // an error is thrown before we can get the tx hash, the tx is not mined
      console.log("tx hash: ", tx.hash);

    } catch(error: any) {
      err = error.message;
    };

    // Insufficient funds for transfer - returned by Hedera
    // Upfront cost exceeds account balance - returned by Besu
    expect(err).to.match(/(?:Insufficient funds for transfer|Upfront cost exceeds account balance)/);
  });

  // EOA -call w value→ NonPayableContract
  it('should not be able to top-level transfer to NonPayableContract', async function() {

    const [owner] = await ethers.getSigners();
    let tx = null;

    try { 
      tx = await owner.sendTransaction({
        to: nonPayableContractAddress,
        value: ethers.parseEther("10"),
        gasLimit: 21100
      });

      console.log("tx hash: ", tx.hash);

      // this throws an error since the transaction reverted
      await tx.wait();

    } catch(error: any) {
      expect(error.message).to.match(/(?:transaction execution reverted|transaction reverted:)/);
    };
  });

  // EOA -call w value→ RejectingPaymentsContract
  it('should not be able to top-level transfer to RejectingPaymentsContract', async function() {

    const [owner] = await ethers.getSigners();
    let tx = null;

    try { 
      tx = await owner.sendTransaction({
        to: rejectingPaymentsContractAddress,
        value: ethers.parseEther("10"),
        gasLimit: 211000
      });

      console.log("tx hash: ", tx.hash);

      // this throws an error because the transaction reverted
      await tx.wait();

    } catch(error: any) {
      expect(error.message).to.match(/(?:transaction execution reverted|transaction reverted:)/);
    };
  });

  // EOA -call w value→ Caller -call w value→ NonPayableContract
  it('should not be able to make an internal CALL WITH VALUE to NonPayableContract', async function() {

    const tx = await callerContract.testCallDoesNotExist(nonPayableContractAddress, {value: ethers.parseEther("10")});
    
    console.log("tx hash: ", tx.hash);

    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  // EOA -call w value→ Caller -call w value→ RejectingPaymentsContract
  it('should not be able to make an internal CALL WITH VALUE to RejectingPaymentsContract', async function() {

    const tx = await callerContract.testCallDoesNotExist(rejectingPaymentsContractAddress, {value: ethers.parseEther("10")});
    
    console.log("tx hash: ", tx.hash);

    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  // EOA -call→ Caller -transfer→ NonPayableContract
  it('should be able to make an internal TRANSFER to NonPayableContract', async function() {


    let tx = null;

    try { 
      tx = await callerContract.testTransfer(nonPayableContractAddress, {
        value: ethers.parseEther("10"),
        gasLimit: 1000000
      });

      console.log("tx hash: ", tx.hash);

      // this throws an error because the transaction reverted
      await tx.wait();

    } catch(error: any) {
      expect(error.message).to.match(/(?:transaction execution reverted|transaction reverted:)/);
    };
  });

  // EOA -call→ Caller -transfer→ RejectingPaymentsContract
  it('should be able to make an internal TRANSFER to RejectingPaymentsContract', async function() {


    let tx = null;

    try { 
      tx = await callerContract.testTransfer(rejectingPaymentsContractAddress, {
        value: ethers.parseEther("10"),
        gasLimit: 1000000
      });

      console.log("tx hash: ", tx.hash);

      // this throws an error because the transaction reverted
      await tx.wait();

    } catch(error: any) {
      expect(error.message).to.match(/(?:transaction execution reverted|transaction reverted:)/);
    };
  });

  // EOA -call→ Caller -send→ NonPayableContract
  it('should be able to make an internal SEND to NonPayableContract', async function() {

    const tx = await callerContract.testSend(nonPayableContractAddress, {value: ethers.parseEther("10")});

    console.log("tx hash: ", tx.hash);
    
    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });

  // EOA -call→ Caller -send→ RejectingPaymentsContract
  it('should be able to make an internal SEND to RejectingPaymentsContract', async function() {

    const tx = await callerContract.testSend(rejectingPaymentsContractAddress, {value: ethers.parseEther("10")});

    console.log("tx hash: ", tx.hash);
    
    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);
  });
  
  //-----

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

    const randAddress = getRandomEthereumAddress();

    const tx = await callerContract.isContractTx(randAddress);

    const rc = await tx.wait();

    const responseEvent = rc.events?.find((event: any) => event.event === "Response");

    expect(responseEvent).to.not.be.eq(undefined);
    expect(responseEvent?.args!.success).to.be.eq(false);

  });

  // Call and Static call tests below:

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
