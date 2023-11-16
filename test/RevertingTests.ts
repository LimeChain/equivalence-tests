import {expect} from "chai";
import {ethers} from 'hardhat';

describe('EVM Calls and internal calls edge cases test', function() {

  let InternalCallerFactory: any;
  let InternalCalleeFactory: any;
  
  let internalCallerContract: any;
  let internalCalleeContract: any;
  
  let internalCallerAddress: string;
  let internalCalleeAddress: string;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  before(async () => {

    InternalCallerFactory = await ethers.getContractFactory("contracts/InternalCaller.sol:InternalCaller");
    InternalCalleeFactory = await ethers.getContractFactory("contracts/InternalCallee.sol:InternalCallee");

    internalCallerContract = await InternalCallerFactory.deploy({gasLimit: 5_000_000});
    internalCalleeContract = await InternalCalleeFactory.deploy({gasLimit: 5_000_000});
    
    internalCallerAddress = internalCallerContract.target;
    internalCalleeAddress = internalCalleeContract.target;

    console.log("Deployed InternalCaller contract on address: ", internalCallerAddress);
    console.log("Deployed InternalCallee contract on address: ", internalCalleeAddress);

    // // We need to wait for the contracts to be mined or some tests will fail
    await sleep(2000);
  });

  // 1. EOA -calls-> InternalCaller -calls-> Existing reverting without revert message
  it('should be able to top-level call InternalCaller that calls reverting', async function() {
    
    const tx = await internalCallerContract.callRevertWithoutRevertReason(internalCalleeAddress);
   
    console.log("tx hash: ", tx.hash);
    
    const rc = await tx.wait();

    expect(rc.status).to.be.eq(1);

  });


});
