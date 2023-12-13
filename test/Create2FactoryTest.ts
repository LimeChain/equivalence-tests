import {ethers} from 'hardhat';

describe('EVM Calls and internal calls edge cases test', function() {

  let Create2FactoryFactory: any;
  let create2FactoryContract: any;
  let create2FactoryAddress: string;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  before(async () => {

    Create2FactoryFactory = await ethers.getContractFactory("contracts/Create2Factory.sol:Create2Factory");
    create2FactoryContract = await Create2FactoryFactory.deploy({gasLimit: 5_000_000});
    create2FactoryAddress = create2FactoryContract.target;

    console.log("Deployed Create2Factory contract on address: ", create2FactoryAddress);

    // We need to wait for the contracts to be mined or some tests will fail
    await sleep(2000);
  });

  it('should be able to deploy inner contract on predictable address', async function() {
    
    // const randAddress = getRandomEthereumAddress();

    // get the address of the contract that will be deployed
    const result = await create2FactoryContract.getDefaultAddress.staticCall();
    console.log("Deploy address: ", result);

    // send some eth to the address to create an account
    const [owner] = await ethers.getSigners();
    const sendTx = await owner.sendTransaction({
      to: result,
      value: ethers.parseEther("10")
    });
    console.log("sendTx hash: ", sendTx.hash);

    // make sure the mirror node has the account
    await sleep(2000);

    // check isContract
    const isContract = await create2FactoryContract.isContract(result);
    console.log("isContract: ", isContract);

    // deploy the contract on the same address
    const tx = await create2FactoryContract.deploy();
    console.log("tx hash: ", tx.hash);

    const rc = await tx.wait();

    // call isContract after contract deploy
    const isContractAfterDeploy = await create2FactoryContract.isContract(result);
    console.log("isContractAfterDeploy: ", isContractAfterDeploy);
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
