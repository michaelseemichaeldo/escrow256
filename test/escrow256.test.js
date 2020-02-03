let Escrow256 = artifacts.require("Escrow256");
let ERC20Token = artifacts.require("./lib/ERC20.sol");
let SimpleToken = artifacts.require("./lib/SimpleToken.sol")
let BN = web3.utils.BN;


contract("Escrow", function(accounts) {

let seller = accounts[0];
let buyer = accounts[1];
let instance;
let instanceSimpleToken;

beforeEach(async () => {
    instance = await Escrow256.new()
    instanceSimpleToken = await SimpleToken.new() //sample ERC20 Token used for testing purposes
})

//test to check that the address deploying the contract is equal to the owner variable in the contract to make sure the owner is set correctly
describe("Setup", async() => {
    it("OWNER should be set to the deploying address", async() => {
        let owner = await instance.owner()
        assert.equal(owner, seller, "the deploying address should be the owner")
    })
})

//testing that the initial escrow Id of a newly deployed escrow contract equals 0, to ensure proper initialisation.
describe("EscrowId", async() => {
    it("Initial EscrowId should be set to zero", async() => {
        let escrowId = await instance.EscrowId.call()
        assert.equal(escrowId, 0, "Initial EscrowId should be set to zero")
    })
})

//testing that the initial escrow Id of a newly created escrow euqals 1, to ensure the id increments as expected upon escrow creation
describe("createEscrowContract", () => {
    it("Creating Escrow should return id of 1", async() => {
        let simpleTokenAddress = instanceSimpleToken.address
        let escrowIdExpected =1
        await instance.createEscrowContract(seller, buyer, simpleTokenAddress, {from: seller})
        let escrowId = await instance.EscrowId.call()
        assert.equal(escrowId, escrowIdExpected, "EscrowId should be 1")
    })
})

//testing that the initial escrow state of a newly created escrow equals CREATED, to ensure the user gets diplayed the correct state
describe("updateState at Escrow Creation", () => {

    it("creating Escrow should set State to CREATED", async() => {
        let simpleTokenAddress = instanceSimpleToken.address
        let expectedState = "CREATED"
        await instance.createEscrowContract(seller, buyer, simpleTokenAddress, {from: seller})
        let escrowState = await instance.getEscrowState(1, {from: seller})
        assert.equal(escrowState, expectedState, "EscrowState should be CREATED")
    })
})

//testing that the escrow created bool value of a newly created escrow euqals true, which is required for some of the other functions to be executed
describe("Update created bool at Escrow Creation", () => {

    it("creating Escrow should set created bool to true", async() => {
        let escrowId = 1
        let simpleTokenAddress = instanceSimpleToken.address
        let expectedState = true
        await instance.createEscrowContract(seller, buyer, simpleTokenAddress, {from: seller})
        let escrowState = await instance.getEscrowCreatedBool(escrowId, {from: seller})
        assert.equal(escrowState, expectedState, "EscrowState should be TRUE")
    })
})

//testing to check that the escrow state equals CANCELED after the cancelTransaction function is called 
describe("updateState at Cancellation", () => {

    it("Canceling Escrow should set State to CANCEL", async() => {
        let expectedState = "CANCELED"
        let escrowId = 1
        let simpleTokenAddress = instanceSimpleToken.address
        await instance.createEscrowContract(seller, buyer, simpleTokenAddress, {from: seller})
        await instance.cancelTransaction(escrowId, simpleTokenAddress,{from: seller})
        let escrowState = await instance.getEscrowState(escrowId, {from: seller})
        assert.equal(escrowState, expectedState, "EscrowState should be CANCELED")
    })
})

//testing to check that the escrow state equals TOKENSELLER_CONFIRMATION_OUTSTANDINGN only the buyer address calls the confirmTransaction function 
describe("updateState at buyerConfirmation", () => {

    it("Buyer confirming Escrow should set State to TOKENSELLER_CONFIRMATION_OUTSTANDING", async() => {
        let expectedState = "TOKENSELLER_CONFIRMATION_OUTSTANDING"
        let numberOfTokens = 100
        let etherAmount = 5
        let escrowId = 1
        let simpleTokenAddress = instanceSimpleToken.address

        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        await instance.buyerDeposit( escrowId, {from: buyer, value: etherAmount})
        await instance.TokenSellerDeposit(simpleTokenAddress,simpleTokenAddress, numberOfTokens, escrowId, {from: seller}) 
        await instance.confirmTransaction(escrowId, {from: buyer})
        let escrowState = await instance.getEscrowState(escrowId, {from: buyer})
        assert.equal(escrowState, expectedState, "EscrowState should be TOKENSELLER_CONFIRMATION_OUTSTANDING")
    })
})

//testing to check that the escrow state equals BUYER_CONFIRMATION_OUTSTANDING only the seller address calls the confirmTransaction function 
describe("updateState at sellerConfirmation", () => {
    let expectedState = "BUYER_CONFIRMATION_OUTSTANDING"
    let numberOfTokens = 100
    let escrowId = 1
    let etherAmount = 5

    it("Seller confirming Escrow should set State to BUYER_CONFIRMATION_OUTSTANDING", async() => {
        let expectedState = "BUYER_CONFIRMATION_OUTSTANDING"
        let numberOfTokens = 100
        let escrowId = 1
        let etherAmount = 5
        let simpleTokenAddress = instanceSimpleToken.address

        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        await instance.buyerDeposit( escrowId, {from: buyer, value: etherAmount})
        await instance.TokenSellerDeposit(simpleTokenAddress, simpleTokenAddress, numberOfTokens, escrowId, {from: seller}) 
        await instance.confirmTransaction(escrowId, {from: seller})
        let escrowState = await instance.getEscrowState(escrowId, {from: seller})
        assert.equal(escrowState, expectedState, "EscrowState should be BUYER_CONFIRMATION_OUTSTANDING")
    })
})


//testing to check that validation fails if total token deposited does not equal total tokens owned by contract
describe("validation of escrow Balance should cause token deposit to fail", () => {

    it("escrow balance validation function should return false if deposited amount does not equal amount owned by contract", async() => {
        let expectedBool = false
        let numberOfTokens1 = 100
        let numberOfTokens2 = 200
        let escrowId = 1
        let simpleTokenAddress = instanceSimpleToken.address
        let error = false
        let expectedError= true
        instanceSimpleToken = await SimpleToken.new()

        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        await instanceSimpleToken.transfer(instance.address, numberOfTokens1, {from: seller})
        await instance.TokenSellerDeposit(simpleTokenAddress, simpleTokenAddress, numberOfTokens2, escrowId, {from: seller}) 
         await instance.getValidated({from: seller})
        try{
            await instance.TokenSellerDeposit(simpleTokenAddress, numberOfTokens2, escrowId, {from: seller}) 
        }
        catch{
            error = true
        }
 
        assert.equal(error, expectedError, "Should return true")
    })
})

//testing to check that the escrow's token balance is updated to 100 when 100 Simple Tokens are sent to the escrow with a particular id by the user
describe("TokenSellerDeposit", () => {

    it("Token should be deposited correctly", async() => {
        let expected = 100
        let numberOfTokens = 100
        let escrowId = 1
        let simpleTokenAddress = instanceSimpleToken.address

        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        await instance.TokenSellerDeposit(simpleTokenAddress, simpleTokenAddress, numberOfTokens, escrowId, {from: seller})
        await instanceSimpleToken.transfer(instance.address, numberOfTokens, {from: seller})
        let tokenBalanceEscrowMapping = await instance.getTokenSellerBalance(escrowId)
        assert.equal(tokenBalanceEscrowMapping, expected, "TokenBalance should be 100")
     })
})

//testing to check that the  SimpleTokens ERC20 contract allocated the initial balance of 10000000000000000000000 to account[0], which is set as the seller account for testing purposes
describe("SimpleToken initial balance", () => {

    it("SimpleToken initial balance", async() => {
        let expected = 10000000000000000000000
        let sellersTokenBalance = await instanceSimpleToken.balanceOf(seller, {from: seller})
        assert.equal(sellersTokenBalance, expected, "TokenBalance should be 10000000000000000000000")
     })
})

//testing to check that the ERC20 SimpleToken smart contract  correctly updates the seller's balance upon transferring 100 SIM tokens to the escrow account
describe("Initial SimpleToken balance after transaction should be reduced by amount of tokens transferred", () => {

    it("Token balance after transaction", async() => {
        let simpleTokenAddress = instanceSimpleToken.address
        let expected =  9999999999999999999900
        let numberOfTokens = 100
        let escrowId = 1
        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        await instance.TokenSellerDeposit(simpleTokenAddress,simpleTokenAddress, numberOfTokens, escrowId, {from: seller})
        await instanceSimpleToken.transfer(instance.address, numberOfTokens, {from: seller})
        let sellersTokenBalance = await instanceSimpleToken.balanceOf(seller, {from: seller})
        assert.equal(sellersTokenBalance, expected, "TokenBalance should be 9999999999999999999900")
     })
})

//testing to check that the buyers ether balance in escrow with escrowId 1 is updated correctly to 1 ether by the escrow contract after the buyer sends 1 ether to the escrow with the escrowId 1
describe("BuyerDeposit", () => {
 
    it("Ether should be deposited correctly", async() => {
        let simpleTokenAddress = instanceSimpleToken.address
        let etherAmount = 1
        let expectedEtherBalance = 1
        let escrowId = 1
        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        await instance.buyerDeposit( escrowId, {from: buyer, value: etherAmount})
        let escrowEtherBalance = await instance.getEtherBalance(escrowId, {from: seller})
        assert.equal(escrowEtherBalance, expectedEtherBalance , "EtherBalance should be 1")
    })
})

//testing to check that the escrow's canceled bool gets updated to true  when the user calls the cancelTransaction function of a particular escrow
describe("update canceled bool upon cancelation", () => {

    it("Canceling Escrow should set cancel variable to true", async() => {
        let escrowId = 1
        let expectedStatusBool = true
        let simpleTokenAddress = instanceSimpleToken.address
        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        let escrowStatusBool = await instance.cancelTransaction.call(escrowId, simpleTokenAddress, {from: seller})
        assert.equal(escrowStatusBool, expectedStatusBool, "canceled should be CANCELED")
    })
})

//testing to check that the escrow ether balance is correct before seller calls the completeTransaction function of that particular escrow
describe("buyerConfirmation & sellerConfirmation", () => {

    it("buyerConfirmation & sellerConfirmation should result in ether balance 5", async() => {
        let etherAmount = 5
        let numberOfTokens = 100
        let etherAmountExpected = 5
        let escrowId = 1
        let simpleTokenAddress = instanceSimpleToken.address
        let instance = await Escrow256.new()
        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        await instanceSimpleToken.transfer(instance.address, numberOfTokens, {from: seller})
        await instance.buyerDeposit( escrowId, {from: buyer, value: etherAmount})
        await instance.TokenSellerDeposit( simpleTokenAddress,simpleTokenAddress, numberOfTokens, escrowId, {from: seller})
        await instance.sellerConfirmTransaction(escrowId,  {from: seller})
        await instance.buyerConfirmTransaction(escrowId,  {from: buyer})
        let escrowEtherBalance = new BN(await instance.getEtherBalance(escrowId, {from: seller})).toString()
        assert.equal(escrowEtherBalance, etherAmountExpected , "EtherBalance should be 5")
    })

})

//testing to check that seller's escrow token balance is correct before the  completeTransaction function of a particular escrow is called (by the seller in this test)
describe("buyerConfirmation & sellerConfirmation", () => {

    it("At buyerConfirmation & sellerConfirmation the seller's token balance should equal 100 at escrowContract", async() => {
        let decimals = 18
        let decimalsBN = new BN(decimals)
        let multiplier = new BN(10).pow(decimalsBN)
       let simpleTokenAddress = instanceSimpleToken.address
       let etherAmount = 5
       let numberOfTokens = 100
       let tokenAmountExpected = 100
       let escrowId = 1
 

       await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
       await instanceSimpleToken.transfer(instance.address, numberOfTokens, {from: seller})
       await instance.buyerDeposit( escrowId, {from: buyer, value: etherAmount})
       await instance.TokenSellerDeposit(simpleTokenAddress, simpleTokenAddress, numberOfTokens, escrowId, {from: seller})
       await instance.sellerConfirmTransaction(escrowId,  {from: seller})
       await instance.buyerConfirmTransaction(escrowId,  {from: buyer})
       let escrowTokenBalance = new BN(await instance.getTokenSellerBalance(escrowId, {from: seller})).toString()
       assert.equal(escrowTokenBalance, tokenAmountExpected , "TokenBalance should be 0")
    })

})

//testing to check that the ERC20 simpleToken balance of the seller is correct before the user calls the completeTransaction function
describe("buyerConfirmation & sellerConfirmation", () => {

    it("At buyerConfirmation & sellerConfirmation the buyer's token balance should be 0 at SimpleToken Contract", async() => {
        let decimals = 18
        let decimalsBN = new BN(decimals)
        let multiplier = new BN(10).pow(decimalsBN)
        let etherAmount = 5
        let numberOfTokens = new BN(100).toString() 
        let tokenAmountExpected = 0
        let escrowId = 1
        let simpleTokenAddress = instanceSimpleToken.address
        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        await instanceSimpleToken.transfer(instance.address, numberOfTokens, {from: seller})
        await instance.buyerDeposit( escrowId, {from: buyer, value: etherAmount})
        await instance.TokenSellerDeposit(simpleTokenAddress, simpleTokenAddress, numberOfTokens, escrowId, {from: seller})
        await instance.sellerConfirmTransaction(escrowId,  {from: seller})
        await instance.buyerConfirmTransaction(escrowId,  {from: buyer})
        let buyersTokenBalance = new BN(await instanceSimpleToken.balanceOf(buyer, {from: buyer})).toString()/multiplier
        assert.equal(buyersTokenBalance, tokenAmountExpected , "TokenBalance should be 100")
    })

})

//testing that the SimpleTokens ERC20 contract has allocated the initial balance of 10000000000000000000000 to owner account[0], which equals the seller account for testing purposes
describe("Stop contract bool", () => {

    it("Stop contract bool", async() => {
        let expectedStopContractBool = true
        await instance.stopContract({from: seller})
        let stopContractBool = await instance.getStopContractBool({from: seller})
        assert.equal(stopContractBool, expectedStopContractBool, "stopped bool should equal true")
     })
})

//testing that trying to deposit ether fails after calling the StopContract function and ether balance should stay unchanged 
describe("Stop contract bool", () => {

    it("Ether deposit should fail after calling StopContract function", async() => {
        let escrowId=1
        let expectedEtherBalance = 0
        let etherAmount = 5
        let instance = await Escrow256.new()
        let simpleTokenAddress = instanceSimpleToken.address
        let escrowEtherBalance = 0
        
        await instance.stopContract({from: seller})
        
        try{
            await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
            await instance.buyerDeposit( escrowId, {from: buyer, value: etherAmount})
            escrowEtherBalance = await instance.getEtherBalance(escrowId, {from: seller})
        }

        catch{
            assert.equal(escrowEtherBalance, expectedEtherBalance, "Ether deposit should fail and ether balance should stay 0 due to error/revert")
        } 
    })
})
})

