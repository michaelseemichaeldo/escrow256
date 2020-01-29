 	<!-- A document called avoiding_common_attacks.md that explains what measures you took to ensure that your contracts are not susceptible to common attacks. (Module 9 Lesson 3) -->
# Reentrancy and Constantinople Reentrancy Attack

The escrow contract uses transfer() instead of contract.call() to transfer Ether. The internal state changes of updating the balances to zero are performed before the ether and erc20 token transfers are executed.


# Front-Running (AKA Transaction-Ordering Dependence)
The escrow256 is not making use of ERC20 approve function. It is also not paying out rewards based on information. This risk is therefore not considered a significant risk for escrow256 contract.


# Integer Overflow and Underflow¶
To avoid integer overflow and underflow issues when the balance reaches the maximum uint value of 2^256 the SafeMath.sol library for arithmetic functions from OpenZeppelin has been imported into the escrow contract. Further, only uint  was used (an alias for uint256), which has higher maximum value than uint8, uint16, uint24...etc



# Denial of Service with Failed Call (SWC-113)
Another potential danger of passing execution to another contract is a denial of service attack (SWC-113). To mitigate this risk I have avoided loops over any arrays in the escrow contract.



# TxOrigin Attack (SWC-115)
To avoid the risk of TxOrigin attach, tx.origin was not used in the smart contracts. Rather msg.sender was used in the escrow contracts.


# Forcibly Sending Ether to a Contract¶
It is possible to forcibly send Ether to a contract without triggering its fallback function. This is an important consideration when placing important logic in the fallback function or making calculations based on a contract's balance. Take the following example:

contract Vulnerable {
    function () payable {
        revert();
    }

    function somethingBad() {
        require(this.balance > 0);
        // Do something bad
    }
}
Contract logic seems to disallow payments to the contract and therefore disallow "something bad" from happening. However, a few methods exist for forcibly sending ether to the contract and therefore making its balance greater than zero.

The selfdestruct contract method allows a user to specify a beneficiary to send any excess ether. selfdestruct does not trigger a contract's fallback function.

#  exposed secrets

Since this is only a test environment with no real ether, it was not considered an issue of making any mnemonics public. Of course once deployed on the mainnet no secrets should be uploaded to a public github space or made otherwises accessible publicly in the smart contract for example.

# security analysis tools
Escrow256.sol was also checked with https://tool.smartdec.net/
Further MythX Security Analysis Plugin for Truffle Framework was installed
