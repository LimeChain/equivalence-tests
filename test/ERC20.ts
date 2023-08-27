import { ethers } from "hardhat";

xdescribe('ERC20 Test Suite', async function () {
    let erc20: any;
    let erc20Address: string;
    let signers: any;


    before(async () => {
        signers = await ethers.getSigners();
        const factory = await ethers.getContractFactory("contracts/ERC20Mock.sol:ERC20Mock");
        erc20 = await factory.deploy("Token", 'SYM');
        erc20Address = erc20.target;
        await erc20.mint(signers[0].address, 1000);
    });

    it('should be able to execute approve(address,uint256)', async function () {
        const res = await erc20.approve(signers[1].address, 100);
        console.log(`Approval Hash: ${res.hash}`)
      })

      it('should be able to execute transfer(address,uint256)', async function () {
        const res = await erc20.transfer(signers[1].address, 100);
        console.log(`Transfer Hash: ${res.hash}`)
      })
});