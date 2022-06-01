//var expect    = require("chai").expect;

import ethers from 'ethers';
/*var VibeGraph = require('../index.js')

var Web3 = require('web3')

let web3Config = require('./testconfig.json')
*/
import Web3 from 'web3'
import { use, should } from 'chai'




import FileHelper from '../../lib/file-helper.mjs'

import MongoInterface from '../../lib/mongo-interface.js'

import IndexerERC721 from '../../indexers/IndexerERC721.js'
 
 let web3Config = FileHelper.readJSONFile('tests/testconfig.json')

 should()


describe("ERC721 Indexer",   function() {

    
    let web3 = new Web3( web3Config.web3provider  )

    let operator = web3.eth.accounts.create() 
    let userA = web3.eth.accounts.create() 
    let userB  = web3.eth.accounts.create() 

    let mongoInterface 

    let indexer 

    
    const nftContractAddress = web3.utils.toChecksumAddress("0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03")


     beforeEach(async function() {

          
         

        let dbName = 'vibegraph_test'    
        mongoInterface = new MongoInterface( ) 
        await mongoInterface.init( dbName ,  {} )

        //should clear out the db  

        await mongoInterface.deleteMany('erc721_balances', { }  )
        await mongoInterface.deleteMany('erc721_token', { }  )

        indexer = new IndexerERC721(   )
        await indexer.initialize( mongoInterface)
    })
 
    it("can add records", async function() { 
         
        let event = {
            event:"transfersingle",
            address: nftContractAddress,
            returnValues:{
            _operator: operator.address,
             _from: userA.address,
             _to: userB.address,
             _id: 2 }} 
        
        await indexer.modifyLedgerByEvent(event,mongoInterface) 
  
        let existingAccount = await mongoInterface.findOne('erc721_balances', {accountAddress: userB.address, contractAddress: nftContractAddress }  )
          
        existingAccount.should.exist 
        existingAccount.tokenIds.should.include(2)

        await indexer.modifyLedgerByEvent(event,mongoInterface) 

        existingAccount = await mongoInterface.findOne('erc721_balances', {accountAddress: userB.address, contractAddress: nftContractAddress }  )
          
        existingAccount.should.exist  
        existingAccount.tokenIds.should.include(2)

          

        let tokenRecord = await mongoInterface.findOne('erc721_token', {tokenId: 2, contractAddress: nftContractAddress }  )
        tokenRecord.accountAddress.should.eql( userB.address )

    });

    it("can remove records", async function() { 
         
        let event = {
            event:"transfersingle",
            address: nftContractAddress,
            returnValues:{
            _operator: operator.address,
             _from: userB.address,
             _to: userA.address,
             _id: 2 }} 
        
        await indexer.modifyLedgerByEvent(event,mongoInterface) 
  
        let existingAccount = await mongoInterface.findOne('erc721_balances', {accountAddress: userB.address, contractAddress: nftContractAddress }  )
          
        existingAccount.should.exist 
        existingAccount.tokenIds.should.not.include(2) 
        
        
        let tokenRecord = await mongoInterface.findOne('erc721_token', {tokenId: 2, contractAddress: nftContractAddress }  )
        tokenRecord.accountAddress.should.eql( userA.address )

    });


   

  
   
       
  });

