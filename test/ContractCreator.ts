import { expect } from "chai";
import { Contract } from 'ethers';
import {ethers, web3} from 'hardhat';
import "@nomiclabs/hardhat-web3";

// type SuccessPromiseSettledResults = PromiseSettledResult<Contract>[]
type SuccessContractPromiseSettledResults = {
  status: string,
  value: Contract
}[];

const SettledStatus = {
  fulfilled: "fulfilled",
  rejected: "rejected"
};

describe('Contract nonces scenarios', function() {

//Contract factories
  let ContractCreatorFactory: any;
  let DoubleContractCreatorFactory: any;
  let DoubleNestedContractCreatorFactory: any;
  let DoubleNestedCallingContractCreatorFactory: any;
  let CallingContractCreatorWithGasFactory: any;
  let CallingContractCreatorWithGasAndValueFactory: any;
  let FirstNestedContractFactory: any;
  let TransferringContractCreatorFactory: any;
  let RecipientContractFactory: any;

//Deployed contracts
  let contractCreator: any;
  let doubleContractCreator: any;
  let doubleNestedContractCreator: any;
  let doubleNestedCallingContract: any;
  let callingContractCreatorWithGas: any;
  let callingContractCreatorWithGasAndValue: any;
  let firstNestedContract: any;
  let transferringContractCreator: any;
  let recipientContract: any;

//Deployed contract addresses
  let contractCreatorAddress: string;
  let doubleContractCreatorAddress: string;
  let doubleNestedContractCreatorAddress: string;
  let doubleNestedCallingContractCreatorAddress: string;
  let callingContractCreatorWithGasAddress: string;
  let callingContractCreatorWithGasAndValueAddress: string;
  let firstNestedContractAddress: string;
  let transferringContractCreatorAddress: string;
  let recipientContractAddress: string;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  before(async () => {
    ContractCreatorFactory = await ethers.getContractFactory("contracts/ContractCreator.sol:ContractCreator");
    DoubleContractCreatorFactory = await ethers.getContractFactory("contracts/ContractCreator.sol:DoubleContractCreator");
    DoubleNestedContractCreatorFactory = await ethers.getContractFactory("contracts/ContractCreator.sol:DoubleNestedContractCreator");
    DoubleNestedCallingContractCreatorFactory = await ethers.getContractFactory("contracts/ContractCreator.sol:DoubleNestedCallingContractCreator");
    CallingContractCreatorWithGasFactory = await ethers.getContractFactory("contracts/ContractCreator.sol:CallingContractCreatorWithGas");
    CallingContractCreatorWithGasAndValueFactory = await ethers.getContractFactory("contracts/ContractCreator.sol:CallingContractCreatorWithGasAndValue");
    FirstNestedContractFactory = await ethers.getContractFactory("contracts/ContractCreator.sol:FirstNestedContract");
    TransferringContractCreatorFactory = await ethers.getContractFactory("contracts/ContractCreator.sol:TransferringContractCreator");
    RecipientContractFactory = await ethers.getContractFactory("contracts/ContractCreator.sol:RecipientContract");

    await sleep(4000);
  });

  //Contract Create of A which deploys contract B in CONSTRUCTOR
  it('should be able to deploy a nested contract in constructor', async function() {
    contractCreator = await ContractCreatorFactory.deploy({gasLimit: 5_000_000});
    contractCreatorAddress = contractCreator.target;
    
    console.log("Deployed ContractCreator contract on address: ", contractCreatorAddress);
  });

  //Contract Create of A which deploys contract B and C in CONSTRUCTOR
  it('should be able to deploy two nested contracts in constructor', async function() {
    doubleContractCreator = await DoubleContractCreatorFactory.deploy(false, false, {gasLimit: 5_000_000});
    doubleContractCreatorAddress = doubleContractCreator.target;
    
    console.log("Deployed DoubleContractCreator contract on address: ", doubleContractCreatorAddress);
  });

  //Contract Create of A which deploys contract B which deploys contract C in CONSTRUCTOR
  it('should be able to deploy two nested contracts in constructor', async function() {
    doubleContractCreator = await DoubleContractCreatorFactory.deploy(false, false, {gasLimit: 1_000_000});
    doubleContractCreatorAddress = doubleContractCreator.target;
    
    console.log("Deployed DoubleNestedContractCreator contract on address: ", doubleContractCreatorAddress);
  });

  //Contract Create of A which deploys contract B and tries to deploy contract C, which reverts in a try/catch in CONSTRUCTOR
  it('should be able to deploy two nested contracts in constructor with the second deploy reverting in a try/catch block in constructor', async function() {
    doubleContractCreator = await DoubleContractCreatorFactory.deploy(true, true, {gasLimit: 1_000_000});
    doubleContractCreatorAddress = doubleContractCreator.target;
    
    console.log("Deployed DoubleContractCreator contract with reverting second deploy using try/catch on address: ", doubleContractCreatorAddress);

    let result = await web3.eth.call({
        to: doubleContractCreatorAddress, 
        data: "0xb25de9be"
    });

    const resultAddress = "0x" + (result.substring(26));
    console.log("Successfully created nested contract address is: ", resultAddress);
  });

  //Contract Create of A which deploys contract B and tries to deploy contract C, which reverts without a try/catch in CONSTRUCTOR
  it('should be able to deploy two nested contracts in constructor with the second deploy reverting without a try/catch block in constructor', async function() {
    doubleContractCreator = await DoubleContractCreatorFactory.deploy(true, false, {gasLimit: 1_000_000});
    doubleContractCreatorAddress = doubleContractCreator.target;
    
    console.log("Deployed DoubleContractCreator contract with reverting second deploy without using try/catch on address: ", doubleContractCreatorAddress);

    let result = await web3.eth.call({
        to: doubleContractCreatorAddress, 
        data: "0xb25de9be"
    });

    const resultAddress = "0x" + (result.substring(26));
    expect(resultAddress).to.be.eq("0x");
  });

  //Contract create of A which deploys contract B which deploys contract C in CONSTRUCTOR
  it('should be able to deploy a contract in constructor which deploys another contract in constructor', async function() {
    doubleNestedContractCreator = await DoubleNestedContractCreatorFactory.deploy(false, false, {gasLimit: 8_000_000});
    doubleNestedContractCreatorAddress = doubleNestedContractCreator.target;
    
    console.log("Deployed DoubleNestedContractCreator contract on address: ", doubleNestedContractCreatorAddress);

    await sleep(2000);

    let firstResult = await web3.eth.call({
        to: doubleNestedContractCreatorAddress, 
        data: "0xb25de9be"
    });

    const firstAddress = "0x" + (firstResult.substring(26));
    console.log("Successfully created first nested contract address is: ", firstAddress);

    let secondResult = await web3.eth.call({
        to: firstAddress, 
        data: "0xb25de9be"
    });

    const secondAddress = "0x" + (secondResult.substring(26));
    console.log("Successfully created second nested contract address is: ", secondAddress);
  });

  //Contract create of A which deploys contract B which tries to deploy reverting contract C without try/catch in CONSTRUCTOR
  it('should be able to deploy a contract in constructor which deploys another contract in constructor', async function() {
    doubleNestedContractCreator = await DoubleNestedContractCreatorFactory.deploy(true, false, {gasLimit: 5_000_000});
    doubleNestedContractCreatorAddress = doubleNestedContractCreator.target;
    
    console.log("Deployed DoubleNestedContractCreator contract with reverting second deploy without try/catch on address: ", doubleNestedContractCreatorAddress);

    let firstResult = await web3.eth.call({
        to: doubleNestedContractCreatorAddress, 
        data: "0xb25de9be"
    });

    const firstAddress = "0x" + (firstResult.substring(26));
    expect(firstAddress).to.be.eq("0x");
  });

  //Contract create of A which deploys contract B which tries to deploy reverting contract C with try/catch in CONSTRUCTOR
  it('should be able to deploy a contract in constructor which deploys another contract in constructor', async function() {
    doubleNestedContractCreator = await DoubleNestedContractCreatorFactory.deploy(true, true, {gasLimit: 5_000_000});
    doubleNestedContractCreatorAddress = doubleNestedContractCreator.target;
    
    console.log("Deployed DoubleNestedContractCreator contract with reverting second deploy with try/catch on address: ", doubleNestedContractCreatorAddress);

    await sleep(2000);

    let firstResult = await web3.eth.call({
        to: doubleNestedContractCreatorAddress, 
        data: "0xb25de9be"
    });

    const firstAddress = "0x" + (firstResult.substring(26));
    console.log("Successfully created first nested contract address is: ", firstAddress);

    let secondResult = await web3.eth.call({
        to: firstAddress, 
        data: "0xb25de9be"
    });

    const secondAddress = "0x" + (secondResult.substring(26));
    expect(secondAddress).to.be.eq("0x0000000000000000000000000000000000000000");
  });

  //Contract create of A which deploys contract B which then is called for nested contract creation
  it('should be able to deploy a nested contract in constructor and create another via call to the newly created contract', async function() {
    doubleNestedCallingContract = await DoubleNestedCallingContractCreatorFactory.deploy({gasLimit: 10_000_000});
    doubleNestedCallingContractCreatorAddress = doubleNestedCallingContract.target;
    
    console.log("Deployed DoubleNestedCallingContractCreator contract on address: ", doubleNestedCallingContractCreatorAddress);

    const tx = await doubleNestedCallingContract.createContract(false, false, {gasLimit: 1_000_000});
    console.log("tx hash: ", tx.hash);

    const rc = await tx.wait();

    let firstResult = await web3.eth.call({
        to: doubleNestedCallingContractCreatorAddress, 
        data: "0xb25de9be"
    });

    const firstAddress = "0x" + (firstResult.substring(26));
    console.log("Successfully created first nested contract address is: ", firstAddress);

    let secondResult = await web3.eth.call({
        to: firstAddress,
        data: "0xb25de9be"
    });

    const secondAddress = "0x" + (secondResult.substring(26));
    console.log("Successfully created second nested contract address is: ", secondAddress);
  });

  //Contract create of A which deploys contract B which then is called for nested contract creation of a reverting contract without try/catch
  it('reverts when trying to deploy a nested contract in constructor and try to create another reverting contract without try/catch via call to the newly created contract', async function() {
    doubleNestedCallingContract = await DoubleNestedCallingContractCreatorFactory.deploy({gasLimit: 6_000_000});
    doubleNestedCallingContractCreatorAddress = doubleNestedCallingContract.target;
    
    console.log("Deployed DoubleNestedCallingContractCreator contract on address: ", doubleNestedCallingContractCreatorAddress);

    await sleep(2000);

    let firstResult = await web3.eth.call({
        to: doubleNestedCallingContractCreatorAddress, 
        data: "0xb25de9be"
    });

    const firstAddress = "0x" + (firstResult.substring(26));
    console.log("Successfully created first nested contract address is: ", firstAddress);

    const tx = await doubleNestedCallingContract.createContract(true, false, {gasLimit: 1_000_000});

    //would fail
    const rc = await tx.wait();
  });

  //Contract create of A which deploys contract B which then is called for nested contract creation of a reverting contract with try/catch
  it('should be able to deploy a nested contract in constructor and try to create another reverting contract with try/catch via call to the newly created contract', async function() {
    doubleNestedCallingContract = await DoubleNestedCallingContractCreatorFactory.deploy({gasLimit: 6_000_000});
    doubleNestedCallingContractCreatorAddress = doubleNestedCallingContract.target;
    
    console.log("Deployed DoubleNestedCallingContractCreator contract on address: ", doubleNestedCallingContractCreatorAddress);

    await sleep(2000);

    let firstResult = await web3.eth.call({
        to: doubleNestedCallingContractCreatorAddress, 
        data: "0xb25de9be"
    });

    const firstAddress = "0x" + (firstResult.substring(26));
    console.log("Successfully created first nested contract address is: ", firstAddress);

    const tx = await doubleNestedCallingContract.createContract(true, true, {gasLimit: 1_000_000});
    console.log("tx hash: ", tx.hash);

    const rc = await tx.wait();
    expect(rc.status).to.be.eq(1);

    let secondResult = await web3.eth.call({
        to: firstAddress,
        data: "0xb25de9be"
    });

    const secondAddress = "0x" + (secondResult.substring(26));
    expect(secondAddress).to.be.eq("0x0000000000000000000000000000000000000000");
  });

  //Contract create of A which deploys contract B. Then create contract C via contract call to A
  it('should be able to deploy a nested contract in constructor and then another nested contract via separate contract call', async function() {
    doubleNestedCallingContract = await DoubleNestedCallingContractCreatorFactory.deploy({gasLimit: 6_000_000});
    doubleNestedCallingContractCreatorAddress = doubleNestedCallingContract.target;
    
    console.log("Deployed DoubleNestedCallingContractCreator contract on address: ", doubleNestedCallingContractCreatorAddress);

    await sleep(2000);

    let firstResult = await web3.eth.call({
        to: doubleNestedCallingContractCreatorAddress, 
        data: "0xb25de9be"
    });

    const firstAddress = "0x" + (firstResult.substring(26));
    console.log("Successfully created first nested contract address is: ", firstAddress);

    const tx = await doubleNestedCallingContract.createContractDirectly(false, false, {gasLimit: 1_000_000});

    await sleep(2000);

    //returnDirectlyCreatedContractAddress()
    let secondResult = await web3.eth.call({
        to: doubleNestedCallingContractCreatorAddress,
        data: "0x96393f54"
    });

    const secondAddress = "0x" + (secondResult.substring(26));
    console.log("Successfully created second nested contract address is: ", secondAddress);
  });

  //Contract create of A which deploys contract B. Then create reverting contract C via contract call to A without try/catch
  it('should be able to deploy a nested contract in constructor and then try to deploy another nested contract via separate contract call which reverts without try/catch', async function() {
    doubleNestedCallingContract = await DoubleNestedCallingContractCreatorFactory.deploy({gasLimit: 6_000_000});
    doubleNestedCallingContractCreatorAddress = doubleNestedCallingContract.target;
    
    console.log("Deployed DoubleNestedCallingContractCreator contract on address: ", doubleNestedCallingContractCreatorAddress);

    await sleep(2000);

    let firstResult = await web3.eth.call({
        to: doubleNestedCallingContractCreatorAddress, 
        data: "0xb25de9be"
    });

    const firstAddress = "0x" + (firstResult.substring(26));
    console.log("Successfully created first nested contract address is: ", firstAddress);

    const tx = await doubleNestedCallingContract.createContractDirectly(true, false, {gasLimit: 1_000_000});

    await sleep(2000);

    //returnDirectlyCreatedContractAddress()
    let secondResult = await web3.eth.call({
        to: doubleNestedCallingContractCreatorAddress,
        data: "0x96393f54"
    });

    const secondAddress = "0x" + (secondResult.substring(26));
    expect(secondAddress).to.be.eq("0x0000000000000000000000000000000000000000");
  });

  //Given existing contracts A and B. We make Hapi Contract Call of A and A makes solidity call with GAS to B which deploys contract C
  it('should be able to call nested contract function with sufficient GAS and deploys a contract', async function() {
    firstNestedContract = await FirstNestedContractFactory.deploy(false, {gasLimit: 1_000_000});
    firstNestedContractAddress = firstNestedContract.target;
    
    console.log("Deployed FirstNestedContract contract on address: ", firstNestedContractAddress);

    await sleep(2000);

    callingContractCreatorWithGas = await CallingContractCreatorWithGasFactory.deploy({gasLimit: 1_000_000});
    callingContractCreatorWithGasAddress = callingContractCreatorWithGas.target;
    console.log("Deployed CallingContractCreatorWithGas contract on address: ", callingContractCreatorWithGasAddress);

    await sleep(2000);

    const tx = await callingContractCreatorWithGas.createContractWithCallWithGas(firstNestedContractAddress, 5_000_000);

    await sleep(2000);

    let firstResult = await web3.eth.call({
        to: firstNestedContractAddress, 
        data: "0xb25de9be"
    });

    const firstAddress = "0x" + (firstResult.substring(26));
    expect(firstAddress).to.be.not.eq("0x0000000000000000000000000000000000000000");
    console.log("Successfully created first nested contract address is: ", firstAddress);
  });

  //Given existing contracts A and B. We make Hapi Contract Call of A and A makes solidity call with GAS to B which tries to deploy contract C but reverts due to INSUFFICIENT GAS.
  it('reverts on insufficent gas when calling nested contract function with small GAS and it tries to deploy a contract', async function() {
    let firstNestedContract = await FirstNestedContractFactory.deploy(false, {gasLimit: 1_000_000});
    let firstNestedContractAddress = firstNestedContract.target;
    
    console.log("Deployed FirstNestedContract contract on address: ", firstNestedContractAddress);

    await sleep(2000);

    callingContractCreatorWithGas = await CallingContractCreatorWithGasFactory.deploy({gasLimit: 1_000_000});
    callingContractCreatorWithGasAddress = callingContractCreatorWithGas.target;
    console.log("Deployed CallingContractCreatorWithGas contract on address: ", callingContractCreatorWithGasAddress);

    await sleep(2000);

    //would fail
    const tx = await callingContractCreatorWithGas.createContractWithCallWithGas(firstNestedContractAddress, 1);
  });

  //Given existing contracts A and B. We make Hapi Contract Call of A and A makes solidity call with GAS to B which tries to deploy contract C which transfers passed value but does not have enough balance
  it('reverts on insufficent value when calling nested contract function with sufficient GAS and it tries to deploy a contract which makes a transfer in its constructor', async function() {
    recipientContract = await RecipientContractFactory.deploy();
    recipientContractAddress = recipientContract.target;

    await sleep(2000);

    console.log("Deployed RecipientContract contract on address: ", recipientContractAddress);

    transferringContractCreator = await TransferringContractCreatorFactory.deploy({gasLimit: 1_000_000});
    transferringContractCreatorAddress = transferringContractCreator.target;

    await sleep(2000);

    console.log("Deployed TransferringContractCreator contract on address: ", transferringContractCreatorAddress);

    callingContractCreatorWithGasAndValue = await CallingContractCreatorWithGasAndValueFactory.deploy({gasLimit: 1_000_000});
    callingContractCreatorWithGasAndValueAddress = callingContractCreatorWithGasAndValue.target;
    console.log("Deployed CallingContractCreatorWithGasAndValue contract on address: ", callingContractCreatorWithGasAndValueAddress);

    await sleep(2000);

    const tx = await callingContractCreatorWithGasAndValue.createContractWithCallWithGasAndValue(transferringContractCreatorAddress, recipientContractAddress, 1_000_000, {value: 1_000});

    let firstResult = await web3.eth.call({
        to: transferringContractCreatorAddress, 
        data: "0xb25de9be"
    });

    const firstAddress = "0x" + (firstResult.substring(26));
    expect(firstAddress).to.be.eq("0x0000000000000000000000000000000000000000");
  });
});
