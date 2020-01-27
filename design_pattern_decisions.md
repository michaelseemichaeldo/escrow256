<!-- A document called design_pattern_decisions.md that explains why you chose to use the design patterns that you did. -->




# Mortal design pattern 

Implemented mortal design pattern to destroy a contract if need be using the selfdestruct keyword in the destroyContract() function.

# Withdrawal Pattern

Implemented withdrawal pattern protects against re-entrancy and denial of service attacks. The function logic is separated. The TokenSellerDeposit() and buyerDeposit functions handle the accounting of the amounts sent with the transaction. Another function, completeTransaction(), allows accounts to transfer their balance from the contract to their account.


# State Machine

The escrow256 contract contains a struct (EscrowContract) which has certain states in which  different functions can and should be called. The EscrowContract struct starts with state NULL before the function createEscrowContract is created, and once the createEscrowContract function is called it changes to CREATED. From there it has various other states, depending on whether the buyer, the seller, or both have called the confirmTransaction function, at which point the state changes to READY_TO_COMPLETE_TRANSFER. This state is required to execute the completeTransaction function.







# Unused design patterns:
# Speed Bump
Speed bumps slow down actions so that if malicious actions occur, there is time to recover.
Auto deprecation design

# Restricting Access
However, you can restrict other contracts’ access to the state by making state variables private.

# Circuit Breaker
Circuit Breakers are design patterns that allow contract functionality to be stopped. This would be desirable in situations where there is a live contract where a bug has been detected. Freezing the contract would be beneficial for reducing harm before a fix can be implemented.
