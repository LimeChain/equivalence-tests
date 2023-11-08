import {expect} from "chai";
import {ethers} from 'hardhat';

describe('EVM Calls and internal calls edge cases test', function() {

  let CallerFactory: any;
  let callerContract: any;
  let callerAddress: string;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  before(async () => {

    // CallerFactory = await ethers.getContractFactory("contracts/LowLevelCall.sol:Caller");
    // callerContract = await CallerFactory.deploy({gasLimit: 5_000_000});
    // callerAddress = callerContract.target;

    // console.log("Deployed Caller contract on address: ", callerAddress);

    // // We need to wait for the contracts to be mined or some tests will fail
    // await sleep(2000);
  });

  it('should be able to top-level TRANSFER to a NON-EXISTING account', async function() {
    

    const [owner] = await ethers.getSigners();

    const wallet = ethers.Wallet.createRandom(owner.provider)

    console.log("Generated wallet with address: ", wallet.address);

    const tx = await owner.sendTransaction({
      to: wallet.address,
      value: ethers.parseEther("10")
    });

    console.log("Auto creation tx hash: ", tx.hash);

    var address = getRandomEthereumAddress();

    const tx2 = await wallet.signTransaction({
      type: 0,
      to: null,
      data: '0x604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3',
      nonce: 0,
      gasLimit: '0x493E0',
      gasPrice: '0x1802BA9F400',
      chainId: '0x12a',
    });

    const tx3 = await wallet.signTransaction({
      type: 0,
      to: null,
      data: '0x604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3',
      nonce: 0,
      gasLimit: '0x493E0',
      gasPrice: '0x184D3C1BC00',
      chainId: '0x128',
    });

    console.log("Auto-created initiated tx hash low fee: ", tx2);
    console.log("Auto-created initiated tx hash high fee: ", tx3);

    // const tx3 = await wallet.sendTransaction({
    //   type: 0,
    //   to: owner.address,
    //   value: ethers.parseEther("1")
    // });

    // console.log("Auto-created initiated tx 2 hash: ", tx3.hash);
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


/*
  // send funds to non-existing account. In Hedera, that would cost 600,000 gas
    // Send less gas on purpose so that the transaction fails
    const tx2 = await wallet.signTransaction({
      type: 0,
      to: null,
      data: '0x604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3',
      nonce: 0,
      gasLimit: '0x493E0',
      gasPrice: '0xA54F4C3C00',
      chainId: '0x12a',
    });


      // send funds to non-existing account. In Hedera, that would cost 600,000 gas
    // Send less gas on purpose so that the transaction fails
    const tx2 = await wallet.sendTransaction({
      type: 0,
      to: address,
      value: ethers.parseEther("1"),
      gasLimit: 21000
    });
    */