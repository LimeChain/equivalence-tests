// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// A -> create -> B
contract ContractCreator {

    address public firstNestedContractAddress;

    constructor() {
        FirstNestedContract firstNestedContract = new FirstNestedContract(false);
        firstNestedContractAddress = address(firstNestedContract);
    }

    function returnNestedContractAddress() public view returns (address) {
        return firstNestedContractAddress;
    }
}

//A -> create -> B + C
//A -> create -> B + C (revert with try/catch)
//A -> create -> B + C (revert without try/catch)
contract DoubleContractCreator {

    address public firstNestedContractAddress;
    address public secondNestedContractAddress;

    constructor(bool shouldRevertOnSecond, bool shouldHaveTryCatchOnSecond) {
        FirstNestedContract firstNestedContract = new FirstNestedContract(false);
        firstNestedContractAddress = address(firstNestedContract);

        if(shouldRevertOnSecond && shouldHaveTryCatchOnSecond) {
            try new SecondNestedContract(true) {
            } catch (bytes memory err) {}
        } else if(shouldRevertOnSecond) {
            new SecondNestedContract(true);
        } else {
             SecondNestedContract secondNestedContract = new SecondNestedContract(false);
             secondNestedContractAddress = address(secondNestedContract);
        }
    }

    function returnNestedContractAddress() public view returns (address) {
        return firstNestedContractAddress;
    }
}

// A -> create -> B -> create -> C
// A -> create -> B -> create -> C (reverts without try/catch)
// A -> create -> B -> create -> C (reverts with try/catch)
contract DoubleNestedContractCreator {

    address public nestedContractAddress;

    constructor(bool shouldRevert, bool shouldHaveTryCatch) {
        NestedContractCreator nestedContract = new NestedContractCreator(shouldRevert, shouldHaveTryCatch);
        nestedContractAddress = address(nestedContract);
    }

    function returnNestedContractAddress() public view returns (address) {
        return nestedContractAddress;
    }
}

// A -> create -> B -> call -> C
// A -> create -> B -> call -> C (reverts without try/catch)
// A -> create -> B -> call -> C (reverts with try/catch)

// A -> create -> B. A -> create with call -> C
// A -> create -> B. A -> create with call -> C (reverts without try/catch)
// A -> create -> B. A -> create with call -> C (reverts with try/catch)
contract DoubleNestedCallingContractCreator {

    address public nestedCallingContractAddress;
    address public directlyCreatedNestedContractAddress;

    constructor() {
        FirstNestedContract nestedContract = new FirstNestedContract(false);
        nestedCallingContractAddress = address(nestedContract);
    }

    function createContract(bool shouldCallRevert, bool shouldCallHaveTryCatch) public {
        FirstNestedContract(nestedCallingContractAddress).createContract(shouldCallRevert, shouldCallHaveTryCatch);
    }

    function createContractDirectly(bool shouldRevert, bool shouldHaveTryCatch) public {
        if(shouldRevert && shouldHaveTryCatch) {
            try new SecondNestedContract(true) {
            } catch (bytes memory) {}
        } else if(shouldRevert) {
            new SecondNestedContract(true);
        } else {
            SecondNestedContract secondNestedContract = new SecondNestedContract(shouldRevert);
            directlyCreatedNestedContractAddress = address(secondNestedContract);
        }
    }

    function returnNestedContractAddress() public view returns (address) {
        return nestedCallingContractAddress;
    }

    function returnDirectlyCreatedContractAddress() public view returns (address) {
        return directlyCreatedNestedContractAddress;
    }
}

contract NestedContractCreator {
    address public nestedContractAddress;

    constructor(bool shouldRevert, bool shouldHaveTryCatch) {
        if(shouldRevert && shouldHaveTryCatch) {
            try new FirstNestedContract(shouldRevert) {
            } catch (bytes memory err) {}
        } else if(shouldRevert) {
            new FirstNestedContract(shouldRevert);
        } else {
             FirstNestedContract nestedContract = new FirstNestedContract(false);
             nestedContractAddress = address(nestedContract);
        }
    }

    function returnNestedContractAddress() public view returns (address) {
        return nestedContractAddress;
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

contract FirstNestedContract {
    address public nestedContractAddress;

    constructor(bool shouldRevert) {
        if(shouldRevert) {
          revert();
        }
    }

    function createContract(bool shouldRevert, bool shouldHaveTryCatch) public returns (address) {
        if(shouldRevert && shouldHaveTryCatch) {
            try new SecondNestedContract(true) {
            } catch (bytes memory err) {}
        } else if(shouldRevert) {
            new SecondNestedContract(true);
        } else {
            SecondNestedContract secondNestedContract = new SecondNestedContract(shouldRevert);
            nestedContractAddress = address(secondNestedContract);
        }

        return nestedContractAddress;
    }

    function returnNestedContractAddress() public view returns (address) {
        return nestedContractAddress;
    }
}

contract SecondNestedContract {

    constructor(bool shouldRevert) {
        if(shouldRevert) {
          revert();
        }
    }
}

contract TransferringContractCreator {
    address public nestedContractAddress;

    function createTransferringContract(address payable recipient) public payable {
        TransferringContract transferringContract = new TransferringContract(recipient);
        nestedContractAddress = address(transferringContract);

    }

    function returnNestedContractAddress() public view returns (address) {
        return nestedContractAddress;
    }
}

contract TransferringContract {

    constructor(address payable recipient) payable {
        recipient.transfer(msg.value);
    }
}

contract RecipientContract {
    receive() external payable {
    }
}