contract Caller {

    // 0x13848c3e38f8886f3f5d2ad9dff80d8092c2bbb8efd5b887a99c2c6cfc09ac2a
    event Response(bool indexed success, bytes data);

    // 
    function makeCallTo(address payable _addr) public payable {

        (bool success, bytes memory data) = _addr.call{value: msg.value, gas: 600_000}(
            abi.encodeWithSignature('foo()')
        );

        emit Response(success, data);
    }

    function canBeCalled() public pure returns (string memory) {
        return "I can be called!";
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
}
