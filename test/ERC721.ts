import { ethers } from "hardhat";

describe('ERC721 Test Suite', function () {
  const tokenId = 33;
  let signers: any;
  let erc721: any;

  before(async function () {
    signers = await ethers.getSigners()

    const factory = await ethers.getContractFactory("contracts/ERC20Mock.sol:ERC20Mock");
    erc721 = await factory.deploy("TokenName", 'NFTSym');
    await erc721.mint(signers[0].address, tokenId);
  })

  it('should be able to execute approve(address,uint256)', async function () {
    const res = await erc721.approve(signers[1].address, tokenId);
    console.log(`Approval Hash: ${res.hash}`);
  });

  it('should be able to execute transferFrom(address,address,uint256)', async function () {
    const res = await erc721.transferFrom(signers[0].address, signers[1].address, tokenId);
    console.log(`Transfer Hash: ${res.hash}`);
  })
});