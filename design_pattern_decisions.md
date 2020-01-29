<!-- A document called design_pattern_decisions.md that explains why you chose to use the design patterns that you did. -->

# Mortal design pattern 

Escrow256.sol implements the mortal design pattern to destroy a contract if need be using the selfdestruct keyword in the destroyContract() function.

# Withdrawal Pattern

The withdrawal pattern was implemented to protect against re-entrancy and denial of service attacks. The function logic is separated. The TokenSellerDeposit() and buyerDeposit functions handle the accounting of the amounts sent with the transaction. Other functions, like completeTransaction or cancelTransaction, allows accounts to transfer their balance from the contract to the user's account.

# State Machine

The escrow256 contract a struct (EscrowContract) which has certain states and booleans in which  different functions can and should be called, while preventing other functions from being called. The EscrowContract State struct starts with state NULL before the function createEscrowContract is created, and once the createEscrowContract function is called it changes to CREATED. From there it has various other states, depending on whether the buyer, the seller, or both have confirmed the transaction by calling the confirmTransaction function, at which point the state changes to READY_TO_COMPLETE_TRANSFER. This state is displayed to the user and is required to execute the completeTransaction function, which transfers the token and ether to the buyer and seller respectively. There is also a "CANCELED" and a "COMPLETED" state, which prevent further modifications with that particular escrow.

# Circuit Breaker
The escrow contract includes a circuit breakers that allow the contract's completeTransaction or cancelTransaction as well as the ether and token deposit functionalities to be stopped. This would be desirable in situations where there is a live contract where a bug has been detected. Freezing the contract would be beneficial for reducing harm before a fix can be implemented.





