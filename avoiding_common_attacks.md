<!-- A document called avoiding_common_attacks.md that explains what measures you took to ensure that your contracts are not susceptible to common attacks. (Module 9 Lesson 3) -->
# Reentrancy and Constantinople Reentrancy Attack, Cross Function Re-entrancy.

The escrow contract uses transfer() instead of contract.call() to transfer Ether. The internal state changes of Escrows[_escrowId].TokenBalance and Escrows[_escrowId].EtherBalance have been updated before the ether and erc20 token transfer functions are executed. Since the external functions is called last after updating the balances, even if an attacker makes a recursive call to the original function the attacker cannot abuse the state of the contract (Checks-effects-interactions pattern). Further, additional checks like 'canceled' and 'completed' bool and checking that only the buyer or seller calls the function acts as a Mutex to some extent and protect against cross-function reentrancy attacks by preventing any attacker calling both the completeTransaction() and cancelTransaction(). There is validation in the front end that the token seller actually owns the number of tokens the seller wants to transfer before actually attempting to transfer. What is currently in the works is the validation that the escrow contract actually owns the number of tokens that are accounted for by the buyerDeposit() and TokenSellerDeposit() functions.

# Front-Running (AKA Transaction-Ordering Dependence)
The escrow256 is not making use of ERC20 approve function. It is also not paying out rewards based on information. Front-Running is therefore not considered a significant risk for escrow256 contract.

# Integer Overflow and Underflow¶
To avoid integer overflow and underflow issues when the balance reaches the maximum uint value of 2^256 the SafeMath.sol library for arithmetic functions from OpenZeppelin has been imported into the escrow contract. Further, only uint was used ( alias for uint256), which has a higher maximum value than uint8, uint16, uint24...etc and therefore lowers the risk of integer overflow. To handle big numbers the bn.js library was imported in JavaScript at the front end.

# Denial of Service with Failed Call (SWC-113)
Another potential danger of passing execution to another contract is a denial of service attack (SWC-113). To mitigate this risk I have avoided loops over any arrays in the escrow contract.

# TxOrigin Attack (SWC-115)
To avoid the risk of TxOrigin attach, tx.origin was not used in the smart contracts. Rather msg.sender was used in the escrow contracts.

# Forcibly Sending Ether to a Contract¶
There is no logic implemented that depends on the escrow contract's balance. 

#  exposed secrets

There are no secrets stored in the contract. However, since this is only a test environment with no real ether, it was not considered an issue of sharing the mnemonics with any reviewers. Of course once deployed on the mainnet no secrets should be uploaded to a public github space or made otherwise publicly accessible in the smart contract for example.

# security analysis tools
Escrow256.sol was checked with https://tool.smartdec.net/ and mythX, while there were warnings, there were no errors discovered.

# powerful contract administrators
While the contract currently has an owner in the alpha release on the ropsten testnet, the owner will be removed upon final deployment to the live net. When the owner is removed, it will be considered whether to implement an upgradable contract design pattern to allow for future upgrades.

# traditional web security best practices
Https will be implemented before the contract is deployed to the Mainnet.

# cross chain replay attack
Currently not a concern, but this possible attack is something to keep in mind in case of a hard fork.

# gas limits
Should not be an issue in the escrow256 smart contract, since no array are implemented nor are any strings stored from the users.