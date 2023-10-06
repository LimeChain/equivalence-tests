// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// source: https://solidity-by-example.org/call/

contract LowLevelReceiver {

    // 0x59e04c3f0d44b7caf6e8ef854b61d9a51cf1960d7a88ff6356cc5e946b4b5832
    event Received(address caller, uint256 amount, string message);

    fallback() external payable {
        emit Received(msg.sender, msg.value, 'Fallback was called');
    }

    receive() external payable {
        emit Received(msg.sender, msg.value, 'Receive was called');
    }

    function foo(string memory _message, uint256 _x) public payable returns (uint256) {
        emit Received(msg.sender, msg.value, _message);
        return _x + 1;
    }

    function viewCall(uint256 _x) public pure returns (uint256) {
        return _x + 1;
    }
}

contract Caller {

    // 0x13848c3e38f8886f3f5d2ad9dff80d8092c2bbb8efd5b887a99c2c6cfc09ac2a
    event Response(bool indexed success, bytes data);

    // 87ba6179
    function testCallFoo(address payable _addr) public payable {

        (bool success, bytes memory data) = _addr.call{value: msg.value, gas: 600_000}(
            abi.encodeWithSignature('foo(string,uint256)', 'call foo', 123)
        );

        emit Response(success, data);
    }

    function testCallViewCall(address payable _addr) public returns (bool success, bytes memory data) {

        (success, data) = _addr.call{gas: 20_000}(
            abi.encodeWithSignature('viewCall(string,uint256)', 'call foo', 123)
        );

        emit Response(success, data);
    }

    // Calling a function that does not exist triggers the fallback function.
    function testCallDoesNotExist(address payable _addr) public payable {
        
        (bool success, bytes memory data) = _addr.call{value: msg.value}(
            abi.encodeWithSignature('doesNotExist()')
        );

        emit Response(success, data);
    }

    // Calling a function that transfers sent value to a recipient via SEND
    function testSend(address payable _addr) public payable {
        bool success = _addr.send(msg.value);

        emit Response(success, "");
    }

    // Calling a function that transfers sent value to a recipient via TRANSFER
    function testTransfer(address payable _addr) public payable {
        _addr.transfer(msg.value);
    }

    // https://stackoverflow.com/a/73335577/10261711
    // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/a28aafdc85a592776544f7978c6b1a462d28ede2/contracts/utils/Address.sol#L40
    function isContract(address account) public view returns (bool) {
        // This method relies on extcodesize/address.code.length, which returns 0
        // for contracts in construction, since the code is only stored at the end
        // of the constructor execution.

        return account.code.length > 0;
    }

    function isContractTx(address account) public returns (bool doesExist) {
        doesExist = account.code.length > 0;
        bytes memory data = "";
        emit Response(doesExist, data);
    }

    function testCallFooWithWrongAbi(address payable _addr) public payable {
        
        //Add fake 3rd parameter
        (bool success, bytes memory data) = _addr.call{value: msg.value, gas: 20_000}(
            abi.encodeWithSignature('foo(string,uint256,uint256)', 'call foo', 123, 0)
        );

        emit Response(success, data);
    }
}
