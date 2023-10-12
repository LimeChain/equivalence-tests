// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NestedContractAddressHolder {
    address public nestedContractAddress;

    function returnNestedContractAddress() public view returns (address) {
        return nestedContractAddress;
    }
}

contract ConditionalContractCreator {
    address public directlyCreatedNestedContractAddress;

    function createSecondNestedContract(bool shouldRevert, bool shouldHaveTryCatch) public {
        if(shouldRevert && shouldHaveTryCatch) {
            try new SecondNestedContract{salt: bytes32(uint(123))}(true) {
            } catch (bytes memory) {}
        } else if(shouldRevert) {
            new SecondNestedContract{salt: bytes32(uint(123))}(true);
        } else {
            SecondNestedContract secondNestedContract = new SecondNestedContract{salt: bytes32(uint(123))}(shouldRevert);
            directlyCreatedNestedContractAddress = address(secondNestedContract);
        }
    }

    function returnDirectlyCreatedContractAddress() public view returns (address) {
        return directlyCreatedNestedContractAddress;
    }
}

// A -> create -> B
contract ContractCreator {

    address public firstNestedContractAddress;

    constructor() {
        FirstNestedContract firstNestedContract = new FirstNestedContract{salt: bytes32(uint(123))}(false);
        firstNestedContractAddress = address(firstNestedContract);
    }

    function returnNestedContractAddress() public view returns (address) {
        return firstNestedContractAddress;
    }
}

//A -> create -> B + C
//A -> create -> B + C (revert with try/catch)
//A -> create -> B + C (revert without try/catch)
contract DoubleContractCreator is ConditionalContractCreator {

    address public firstNestedContractAddress;

    constructor(bool shouldRevertOnSecond, bool shouldHaveTryCatchOnSecond) {
        FirstNestedContract firstNestedContract = new FirstNestedContract{salt: bytes32(uint(123))}(false);
        firstNestedContractAddress = address(firstNestedContract);

        createSecondNestedContract(shouldRevertOnSecond, shouldHaveTryCatchOnSecond);
    }

    function returnNestedContractAddress() public view returns (address) {
        return firstNestedContractAddress;
    }
}

// A -> create -> B -> create -> C
// A -> create -> B -> create -> C (reverts without try/catch)
// A -> create -> B -> create -> C (reverts with try/catch)
contract DoubleNestedContractCreator is NestedContractAddressHolder {

    constructor(bool shouldRevert, bool shouldHaveTryCatch) {
        NestedContractCreator nestedContract = new NestedContractCreator{salt: bytes32(uint(123))}(shouldRevert, shouldHaveTryCatch);
        nestedContractAddress = address(nestedContract);
    }
}

// A -> create -> B -> call -> C
// A -> create -> B -> call -> C (reverts without try/catch)
// A -> create -> B -> call -> C (reverts with try/catch)

// A -> create -> B. A -> create with call -> C
// A -> create -> B. A -> create with call -> C (reverts without try/catch)
// A -> create -> B. A -> create with call -> C (reverts with try/catch)
contract DoubleNestedCallingContractCreator is ConditionalContractCreator {

    address public nestedCallingContractAddress;

    constructor() {
        FirstNestedContract nestedContract = new FirstNestedContract{salt: bytes32(uint(123))}(false);
        nestedCallingContractAddress = address(nestedContract);
    }

    function createContract(bool shouldCallRevert, bool shouldCallHaveTryCatch) public {
        FirstNestedContract(nestedCallingContractAddress).createContract(shouldCallRevert, shouldCallHaveTryCatch);
    }

    function createContractDirectly(bool shouldRevert, bool shouldHaveTryCatch) public {
        createSecondNestedContract(shouldRevert, shouldHaveTryCatch);
    }

    function returnNestedContractAddress() public view returns (address) {
        return nestedCallingContractAddress;
    }
}

contract NestedContractCreator is NestedContractAddressHolder {

    constructor(bool shouldRevert, bool shouldHaveTryCatch) {
        if(shouldRevert && shouldHaveTryCatch) {
            try new FirstNestedContract(shouldRevert) {
            } catch (bytes memory err) {}
        } else if(shouldRevert) {
            new FirstNestedContract(shouldRevert);
        } else {
             FirstNestedContract nestedContract = new FirstNestedContract{salt: bytes32(uint(123))}(false);
             nestedContractAddress = address(nestedContract);
        }
    }
}

// A -> call with gas -> B -> create -> C
// A -> call with insufficient gas -> B -> create -> C
contract CallingContractCreatorWithGas {

    function createContractWithCallWithGas(address contractAddress, uint gasAmount) public returns (bytes memory) {
        (bool success, bytes memory data) = contractAddress.call{gas: gasAmount}(
            abi.encodeWithSignature('createContract(bool,bool)', false, false)
        );

        if(!success) {
            revert();
        }
    }
}

// A -> call with sufficient gas and unsifficent value -> B -> create -> C -> transfer -> D
contract CallingContractCreatorWithGasAndValue {

    function createContractWithCallWithGasAndValue(address payable contractAddress, address payable recipientAddress, uint gasAmount) public payable {
        (bool success, bytes memory data) = contractAddress.call{value: msg.value, gas: gasAmount}(
            abi.encodeWithSignature('createTransferringContract(address)', recipientAddress)
        );

        if(!success) {
            revert();
        }
    }
}

contract FirstNestedContract is ConditionalContractCreator {

    constructor(bool shouldRevert) {
        if(shouldRevert) {
          revert();
        }
    }

    function createContract(bool shouldRevert, bool shouldHaveTryCatch) public {
        createSecondNestedContract(shouldRevert, shouldHaveTryCatch);
    }
}

contract SecondNestedContract {

    constructor(bool shouldRevert) {
        if(shouldRevert) {
          revert();
        }
    }
}

contract TransferringContractCreator is NestedContractAddressHolder {

    function createTransferringContract(address payable recipient) public payable {
        TransferringContract transferringContract = new TransferringContract{salt: bytes32(uint(123))}(recipient);
        nestedContractAddress = address(transferringContract);
    }
}

contract TransferringContract {

    constructor(address payable recipient) payable {
        recipient.transfer(1000);
    }
}

contract RecipientContract {
    receive() external payable {
    }
}