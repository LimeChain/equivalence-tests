import { ethers } from "hardhat";

describe('ERC20 Test Suite', async function () {
    let erc20: any;
    let erc20Address: string;
    let signers: any;
    let mintTxn: any;


    before(async () => {
        signers = await ethers.getSigners();
        const factory = await ethers.getContractFactory("contracts/ERC20Mock.sol:ERC20Mock");
        erc20 = await factory.deploy("Token", 'SYM');
        erc20Address = erc20.target;
        console.log("Deployed ERC20 contract on address: ", erc20Address);
        mintTxn = await erc20.mint(signers[0].address, 1000, {gasLimit: 1000000});
        console.log(`Mint hash: ${mintTxn.hash}`);
    });

    it('should be able to execute approve(address,uint256)', async function () {
        const res = await erc20.approve(signers[1].address, 100, {gasLimit: 1000000});
        console.log(`Approval Hash: ${res.hash}`)
      })

      it('should be able to execute transfer(address,uint256)', async function () {
        const res = await erc20.transfer(signers[1].address, 100, {gasLimit: 1000000});
        console.log(`Transfer Hash: ${res.hash}`)
      })
});