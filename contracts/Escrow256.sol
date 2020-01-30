pragma solidity  >=0.4.24 <0.7.0;

import "./lib/ERC20.sol";
import "./lib/SafeMath.sol";

///@title A smart contract acting as an escrow for ether and erc20 tokens
/// @author Michael Candreia
/// @notice You can use this contract for the exchange of ether and ERC20 tokens 
/// @dev All function calls are currently implemented without side effects

contract Escrow256 is ERC20 {
    enum State{NULL, CREATED, BUYER_CONFIRMATION_OUTSTANDING, TOKENSELLER_CONFIRMATION_OUTSTANDING, READY_TO_COMPLETE_TRANSFER, CANCELED, COMPLETED}
    uint public EscrowId;
    address payable public owner;
    bool public stopped = false;
    struct EscrowContract {
        address payable buyer;
        address payable tokenSeller;
        State currentState;
        bool buyerConfirmation;
        bool tokenSellerConfirmation;
        bool canceled;
        bool completed;
        ERC20 Token;
        uint TokenBalance;
        uint EtherBalance;
        uint EscrowId;
    }

mapping(uint => EscrowContract) Escrows;

event EscrowContractCreated(uint EscrowId, address buyer, address tokenSeller);
event buyerDepositEvent(uint value);
event sellerDepositEvent(uint value);
event buyerConfirmationEvent(address buyer, State currentState, uint EtherBalance);
event tokenSellerConfirmationEvent(address tokenSeller, State currentState, uint TokenBalance);
event updatedStatusEvent(State currentState);
event completeTransactionEvent(uint etherBalance, State currentState);
event escrowCancellationEvent(State currentState);

constructor() public {
        owner = msg.sender;
    }

/// @notice a modifier to control access to the destroyContract function
modifier onlyOwner() {
    require (msg.sender == owner, "Only allowed by contract owner");
    _;
}
/// @notice a circuit breaker modifier to stop certain functions in case of a critical bug
modifier stopInEmergency { 
    require(!stopped); 
    _; 
}

/// @notice This function will create an escrow contract and store the address of the caller as the seller. The address of the buyer and ERC20 token contract will be stored as provided as well. It will return a unique escrow Id.
function createEscrowContract(address payable _buyer, address payable _tokenSeller, ERC20 _token) public returns (uint) {
    EscrowId = EscrowId + 1;
    bool _buyerConfirmation = false;
    bool _tokenSellerConfirmation = false;
    bool _canceled = false;
    bool _completed = false;
    uint _tokenBalance = 0;
    uint _etherBalance = 0;
    State _currentState = State.CREATED;
    Escrows[EscrowId] = EscrowContract(_buyer, _tokenSeller, _currentState, _tokenSellerConfirmation, _buyerConfirmation, _canceled, _completed, _token, _tokenBalance, _etherBalance, EscrowId);
    emit EscrowContractCreated(EscrowId, _buyer, _tokenSeller);
    return EscrowId;
}

/// @notice This function can be called by either of the parties of the transaction when they agree with the balances displayed in the escrow and would like to go ahead with the exchange
function confirmTransaction(uint _escrowId) public returns(string memory){
    require(msg.sender == Escrows[_escrowId].buyer || msg.sender == Escrows[_escrowId].tokenSeller);

    if (msg.sender == Escrows[_escrowId].buyer){
        this.buyerConfirmTransaction(_escrowId);
    }
    else if(msg.sender == Escrows[_escrowId].tokenSeller){
          this.sellerConfirmTransaction(_escrowId);
    }
}

/// @notice This function will be called by the "confirmTransaction" function if the party calling the function (the msg.sender) is the buyer 
function buyerConfirmTransaction(uint _escrowId) public returns(string memory) {
        Escrows[_escrowId].buyerConfirmation = true;
        this.updateStatus(_escrowId);
        emit buyerConfirmationEvent(Escrows[_escrowId].buyer, Escrows[_escrowId].currentState, Escrows[_escrowId].TokenBalance);
        return getEscrowState(_escrowId);
}

/// @notice This function will be called by the "confirmTransaction" function if the party calling the function (the msg.sender) is the seller 
function sellerConfirmTransaction(uint _escrowId) public returns(string memory) {
        Escrows[_escrowId].tokenSellerConfirmation = true;
        this.updateStatus(_escrowId);
        emit tokenSellerConfirmationEvent(Escrows[_escrowId].tokenSeller, Escrows[_escrowId].currentState, Escrows[_escrowId].TokenBalance);
        return getEscrowState(_escrowId);
}

/// @notice This function will update the status of the escrow with a particular Id to either CANCELED, COMPLETED, TOKENSELLER_CONFIRMATION_OUTSTANDING, BUYER_CONFIRMATION_OUTSTANDING, READY_TO_COMPLETE_TRANSFER
function updateStatus(uint _escrowId) public {
    if (Escrows[_escrowId].canceled){
        Escrows[_escrowId].currentState = State.CANCELED;
    }
    else if (Escrows[_escrowId].completed){
        Escrows[_escrowId].currentState = State.COMPLETED;
    }
    else if (Escrows[_escrowId].buyerConfirmation && !Escrows[_escrowId].tokenSellerConfirmation) {
        Escrows[_escrowId].currentState = State.TOKENSELLER_CONFIRMATION_OUTSTANDING;
        }
    else if (Escrows[_escrowId].tokenSellerConfirmation && !Escrows[_escrowId].buyerConfirmation){
        Escrows[_escrowId].currentState = State.BUYER_CONFIRMATION_OUTSTANDING;
    }
    else if (Escrows[_escrowId].tokenSellerConfirmation && Escrows[_escrowId].buyerConfirmation){
        Escrows[_escrowId].currentState = State.READY_TO_COMPLETE_TRANSFER;
    }
    emit updatedStatusEvent(Escrows[_escrowId].currentState);
}

/// @notice This function can be called by the buyer when sending ether. It updates the ether balance of the escrow with the respective Id.  
function buyerDeposit(uint _escrowId) public stopInEmergency payable {
    require(msg.sender == Escrows[_escrowId].buyer, "Does not match buyers address entered at creation of escrow");
    //require(msg.value >= 0 && msg.value <= 100 ether, "chose a value between 1 and 100 ether");
    Escrows[_escrowId].EtherBalance = Escrows[_escrowId].EtherBalance.add( msg.value);
    emit buyerDepositEvent(msg.value);
}

/// @notice This function can be called by the seller when sending the erc20 token. It updates the token balance of the escrow with the respective Id.  
function TokenSellerDeposit( uint _numberOfTokens, uint _escrowId) public stopInEmergency returns (uint) {
    require(msg.sender == Escrows[_escrowId].tokenSeller, "Sender does not match sellers address entered at creation of escrow");
    require(!Escrows[_escrowId].canceled, "The escrow has been canceled by one of the parties and cannot be used anymore");
    require(!Escrows[_escrowId].completed, "The escrow transaction with this ID has already completed and cannot be used anymore");
    Escrows[_escrowId].TokenBalance = Escrows[_escrowId].TokenBalance.add( _numberOfTokens);
    emit sellerDepositEvent(Escrows[_escrowId].TokenBalance);
    uint TokenBalance = Escrows[_escrowId].TokenBalance;
    return TokenBalance;
}

/// @notice This function sets the state of the escrow to to "CANCELED" and returns the respective balances to the buyer and seller. This function can be called by either party of the transaction.
function cancelTransaction(uint _escrowId) public stopInEmergency returns (bool) {
        require((msg.sender == Escrows[_escrowId].buyer ) || (msg.sender == Escrows[_escrowId].tokenSeller), "Only buyer or seller account can cancel transaction");
        require (!Escrows[_escrowId].canceled);
        address payable tokenSeller = Escrows[_escrowId].tokenSeller;
        address payable buyer = Escrows[_escrowId].buyer;
        uint TokenBalance = Escrows[_escrowId].TokenBalance;
        uint EtherBalance = Escrows[_escrowId].EtherBalance;
        ERC20 Token = Escrows[_escrowId].Token;
        Escrows[_escrowId].EtherBalance = 0; 
        Escrows[_escrowId].TokenBalance = 0;
        buyer.transfer(EtherBalance); 
        Token.transfer(tokenSeller, TokenBalance); 
    
        Escrows[_escrowId].canceled = true;
        Escrows[_escrowId].currentState = State.CANCELED;
        emit escrowCancellationEvent(Escrows[_escrowId].currentState);
        return Escrows[_escrowId].canceled;
}

/// @notice This function completes the exchange, sets the state of the escrow to to "COMPLETED" and transfers the respective balances to the buyer and seller. This function can be called by either party of the transaction.
function completeTransaction(uint _escrowId) public stopInEmergency {
        require(!Escrows[_escrowId].canceled, "Escrow got canceled");
        require(Escrows[_escrowId].buyerConfirmation, "Both buyer and seller need to confirm to complete transaction");
        require(Escrows[_escrowId].tokenSellerConfirmation, "Both buyer and seller need to confirm to complete transaction");

        address payable tokenSeller = Escrows[_escrowId].tokenSeller;
        uint EtherBalance = Escrows[_escrowId].EtherBalance;
        address payable buyer = Escrows[_escrowId].buyer;
        uint TokenBalance = Escrows[_escrowId].TokenBalance;
        Escrows[_escrowId].EtherBalance = 0; 
        Escrows[_escrowId].TokenBalance = 0;
        ERC20 Token = Escrows[_escrowId].Token;
        tokenSeller.transfer(EtherBalance);
        Token.transfer(buyer, TokenBalance); 
        Escrows[_escrowId].completed = true;
        this.updateStatus(_escrowId);
        emit completeTransactionEvent(Escrows[_escrowId].EtherBalance, Escrows[_escrowId].currentState);
}

/// @notice To return the ether balance of the escrow with the provided Id this function can be called
function getEtherBalance(uint _escrowId) public view returns (uint) {
        uint etherBalance = Escrows[_escrowId].EtherBalance;
        return etherBalance;
}

/// @notice This function returns the token balance of the escrow with the provided Id 
function getTokenSellerBalance(uint _escrowId) public view returns (uint) {
        return Escrows[_escrowId].TokenBalance;
}

/// @notice This function calls the "getEscrowStateString" function to return the State of the escrow in question 
function getEscrowState(uint _escrowId) public view returns (string memory) {
        return getEscrowStateString(_escrowId);
}

/// @notice This function is called by the "getEscrowState" function and returns the State of the escrow queried
function getEscrowStateString(uint _escrowId) public view returns (string memory){
        if  (Escrows[_escrowId].currentState == State.NULL) return "NO ESCROW WITH THIS ID";
        if  (Escrows[_escrowId].currentState == State.CREATED) return "CREATED";
        if  (Escrows[_escrowId].currentState == State.BUYER_CONFIRMATION_OUTSTANDING) return "BUYER_CONFIRMATION_OUTSTANDING";
        if  (Escrows[_escrowId].currentState == State.TOKENSELLER_CONFIRMATION_OUTSTANDING) return "TOKENSELLER_CONFIRMATION_OUTSTANDING";
        if  (Escrows[_escrowId].currentState == State.READY_TO_COMPLETE_TRANSFER) return "READY_TO_COMPLETE_TRANSFER";
        if  (Escrows[_escrowId].currentState == State.CANCELED) return "CANCELED";
        if  (Escrows[_escrowId].currentState == State.COMPLETED) return "COMPLETED";
}

/// @notice This function returns the latest escrow id 
function getEscrowId() public view returns (uint) {
        return EscrowId;
}

/// @notice This function returns the address of the buyer
function getBuyerAccountAddress(uint _escrowId) public view returns (address) {
        return Escrows[_escrowId].buyer;
}

/// @notice This function returns the address of the seller
function getSellerAccountAddress(uint _escrowId) public view returns (address) {
        return Escrows[_escrowId].tokenSeller;
}

/// @notice change the bool stopped to true for the circuit breaker modifier used to stop certain functions in case of a critical bug
function stopContract() public onlyOwner {
        stopped = true;
    }
/// @notice change the bool stopped to false for the circuit breaker modifier used to stop certain functions in case of a critical bug
function resumeContract() public onlyOwner {
        stopped = false;
}

/// @notice This function destroys this smart contract can only be called by the owner, i.e. the address from which this contract has initially been deployed. This function allows the owner to kill the contract if there are serious issues with it and redeploy it after fixing the issue. The function will only be there during the beta phase and will be removed eventually in the final version.
function destroyContract() public onlyOwner{
        selfdestruct(owner);
}

}