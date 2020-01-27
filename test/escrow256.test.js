let Escrow256 = artifacts.require("Escrow256");
let ERC20Token = artifacts.require("./lib/ERC20.sol");
let BN = web3.utils.BN;

contract("Escrow", function(accounts) {

let seller = accounts[0];
let buyer = accounts[1];
let ERC20Token = '0x5b0b7A8C24e6b87785d204eA4A36eb2310d3f998';
let instance;

beforeEach(async () => {
    instance = await Escrow256.new()
})

describe("Setup", async() => {
    it("OWNER should be set to the deploying address", async() => {
        let owner = await instance.owner()
        assert.equal(owner, seller, "the deploying address should be the owner")
    })
})

describe("EscrowId", async() => {
    it("Initial EscrowId should be set to zero", async() => {
        let escrowId = await instance.EscrowId.call()
        assert.equal(escrowId, 0, "Initial EscrowId should be set to zero")
    })
})

describe("createEscrowContract", () => {
    it("Creating Escrow should return id of 1", async() => {
        //await instance.createEscrowContract(seller, buyer, ERC20Token, {from: seller})
        await instance.createEscrowContract(seller, buyer, ERC20Token, {from: seller})
        let escrowId = await instance.EscrowId.call()
        assert.equal(escrowId.valueOf(), 1, "EscrowId should be 1")
    })
})

describe("updateStatus at Escrow Creation", () => {

    it("creating Escrow should set Status to CREATED", async() => {
        let expectedStatus = "CREATED"
        await instance.createEscrowContract(seller, buyer, ERC20Token, {from: seller})
        let escrowStatus = await instance.getEscrowState(1, {from: seller})
        assert.equal(escrowStatus, expectedStatus, "EscrowStatus should be CREATED")
    })
})

describe("updateStatus at Creation", () => {
    it("Creating Escrow should set Status to CREATED", async() => {
        let expectedStatus = "CREATED"
        await instance.createEscrowContract(seller, buyer, ERC20Token, {from: seller})
        let escrowStatus = await instance.getEscrowState(1, {from: seller})
        assert.equal(escrowStatus, expectedStatus, "EscrowStatus should be CREATED")
    })
})

describe("updateStatus at Cancellation", () => {
    let _escrowId = 1

    it("Cancelling Escrow should set Status to CANCELLED", async() => {
        let expectedStatus = "CANCELED"
        await instance.createEscrowContract(seller, buyer, ERC20Token, {from: seller})
        await instance.cancelTransaction(_escrowId)
        //await instance.buyerDeposit( _escrowId, {from: buyer, value: etherAmount})
        //await instance.TokenSellerDeposit(ERC20Token, _numberOfTokens, _escrowId, {from: seller}) 
        let escrowStatus = await instance.getEscrowState(_escrowId, {from: seller})
        assert.equal(escrowStatus, expectedStatus, "EscrowStatus should be CANCELLED")
    })
})

describe("updateStatus at buyerConfirmation", () => {
    let seller = accounts[0]
    let buyer = accounts[1]
    let expectedStatus = "TOKENSELLER_CONFIRMATION_OUTSTANDING"
    let _numberOfTokens = 1000
    let _escrowId = 1
    let etherAmount = 5


    it("Buyer confirming Escrow should set Status to TOKENSELLER_CONFIRMATION_OUTSTANDING", async() => {
        await instance.createEscrowContract(seller, buyer, ERC20Token, {from: seller})
        await instance.buyerDeposit( _escrowId, {from: buyer, value: etherAmount})
        await instance.TokenSellerDeposit(ERC20Token, _numberOfTokens, _escrowId, {from: seller}) 
        await instance.buyerConfirmTransaction(_escrowId, {from: buyer})
        let escrowStatus = await instance.getEscrowState(1, {from: buyer})
        assert.equal(escrowStatus, expectedStatus, "EscrowStatus should be TOKENSELLER_CONFIRMATION_OUTSTANDING")
    })
})

describe("updateStatus at sellerConfirmation", () => {
    let seller = accounts[0]
    let buyer = accounts[1]
    let expectedStatus = "BUYER_CONFIRMATION_OUTSTANDING"
    let _numberOfTokens = 1000
    let _escrowId = 1
    let etherAmount = 5

    it("Seller confirming Escrow should set Status to BUYER_CONFIRMATION_OUTSTANDING", async() => {
        await instance.createEscrowContract(seller, buyer, ERC20Token, {from: seller})
        await instance.buyerDeposit( _escrowId, {from: buyer, value: etherAmount})
        await instance.TokenSellerDeposit(ERC20Token, _numberOfTokens, _escrowId, {from: seller}) 
        await instance.sellerConfirmTransaction(_escrowId, {from: seller})
        let escrowStatus = await instance.getEscrowState(_escrowId, {from: seller})
        assert.equal(escrowStatus, expectedStatus, "EscrowStatus should be BUYER_CONFIRMATION_OUTSTANDING")
    })
})

describe("TokenSellerDeposit", () => {
    let seller = accounts[0]
    let buyer = accounts[1]
    let expected = 1000
    let _numberOfTokens = 1000
    let _escrowId = 1
    let etherAmount = 5


    it("Token should be sent correctly", async() => {
        instance = await Escrow256.new()
        await instance.createEscrowContract(seller, buyer, ERC20Token, {from: seller})
        await instance.TokenSellerDeposit(ERC20Token, _numberOfTokens, _escrowId, {from: seller})
        let tokenBalanceEscrowMapping = await instance.getTokenSellerBalance(_escrowId)
        assert.equal(tokenBalanceEscrowMapping, expected, "TokenBalance should be 1000")
     })
})

describe("BuyerDeposit", () => {
    let seller = accounts[0]
    let buyer = accounts[1]
    let _escrowId = 1
    let etherAmount = 5
    let expectedEtherBalance = 5
    //let etherBalanceEscrowMapping
    let instance

    it("Ether should be deposited correctly", async() => {
        instance = await Escrow256.new()
        await instance.createEscrowContract(seller, buyer, ERC20Token, {from: seller})
        await instance.buyerDeposit( _escrowId, {from: buyer, value: etherAmount})
        let escrowEtherBalance = await instance.getEtherBalance(_escrowId, {from: seller})
        assert.equal(escrowEtherBalance, expectedEtherBalance , "EtherBalance should be 5")
        //etherBalanceEscrowMapping = instance.Escrows[_escrowId].etherBalance
        //etherBalance = instance.balanceOf(this)
        //assert.equal(etherBalance, etherBalanceEscrowMapping, "Token Balance of Escrow should equal balance of mapping")
    })
})

describe("CompleteTransaction", () => {
    let seller = accounts[0];
    let buyer = accounts[1];
    let _escrowId = 1
    let etherAmount = 5
    let _numberOfTokens = 1000

    it("completeTransaction should result in ether balance 0", async() => {
       instance = await Escrow256.new()
       await instance.createEscrowContract(seller, buyer, ERC20Token, {from: seller})
       await instance.buyerDeposit( _escrowId, {from: buyer, value: etherAmount})
       await instance.TokenSellerDeposit(ERC20Token, _numberOfTokens, _escrowId, {from: seller})
       await instance.sellerConfirmTransaction(_escrowId,  {from: seller})
       await instance.buyerConfirmTransaction(_escrowId,  {from: buyer})
       await instance.completeTransaction( _escrowId)
       let escrowEtherBalance = await instance.getEtherBalance(_escrowId, {from: seller})
       assert.equal(escrowEtherBalance, 0 , "EtherBalance should be 0")
       //etherBalance = instance.balanceOf(this)
    })

})



})


