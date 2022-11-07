
const VibegraphIndexer = require('./VibegraphIndexer')

const web3utils = require('web3').utils


module.exports = class IndexerERC721 extends VibegraphIndexer{


    constructor(   mongoInterface  ) {
        super()
        if(mongoInterface){
            this.mongoInterface = mongoInterface
        }
    }

    async initialize( ){
 

    }

    async modifyLedgerByEvent(event){

        await IndexerERC721.modifyERC721LedgerByEvent(event,this.mongoInterface)

    }
 
 

  
    static async modifyERC721LedgerByEvent(event,mongoInterface){
        
         
        let eventName = event.event 

        let blockNumber = event.blockNumber
        let transactionHash = event.transactionHash
        let transactionIndex = event.transactionIndex 

        if(!eventName){
            console.log('WARN: unknown event in ', event.transactionHash )
            return 
        }
        eventName = eventName.toLowerCase()
        

        let outputs = event.returnValues
 
        let contractAddress = web3utils.toChecksumAddress(event.address)
       

        if(eventName == 'transfer' ){
            let from = web3utils.toChecksumAddress(outputs['0'] )
            let to = web3utils.toChecksumAddress(outputs['1'] )
            let tokenId = parseInt(outputs['2'])    

            await IndexerERC721.recordTransfer( from, to ,contractAddress , tokenId ,blockNumber, transactionIndex  ,mongoInterface) 
            
            await IndexerERC721.setOwnerOfERC721Token( to ,contractAddress , tokenId  ,mongoInterface) 
             
            await IndexerERC721.removeERC721TokenFromAccount( from ,contractAddress , tokenId  ,mongoInterface )
            await IndexerERC721.addERC721TokenToAccount( to ,contractAddress , tokenId  ,mongoInterface) 
        }

        if(eventName == 'transfersingle' ){
            let from = web3utils.toChecksumAddress(outputs._from )
            let to = web3utils.toChecksumAddress(outputs._to )
            let tokenId = parseInt(outputs._id)

            await IndexerERC721.recordTransfer( from, to ,contractAddress , tokenId ,blockNumber, transactionIndex  ,mongoInterface) 
              
            await IndexerERC721.setOwnerOfERC721Token( to ,contractAddress , tokenId  ,mongoInterface) 
            
            await IndexerERC721.removeERC721TokenFromAccount( from ,contractAddress , tokenId  ,mongoInterface )
            await IndexerERC721.addERC721TokenToAccount( to ,contractAddress , tokenId  ,mongoInterface ) 
        }
       
    }

    static async removeERC721TokenFromAccount( accountAddress ,contractAddress , tokenId ,mongoInterface ){
        tokenId = parseInt(tokenId)

        let existingAccount = await mongoInterface.findOne('erc721_balances', {accountAddress: accountAddress, contractAddress: contractAddress }  )

        if(existingAccount){
            let tokenIdsArray = existingAccount.tokenIds

            let index = tokenIdsArray.indexOf( tokenId );
            if (index > -1) {
                tokenIdsArray.splice(index, 1);
            }

            await mongoInterface.updateOne('erc721_balances', {accountAddress: accountAddress, contractAddress: contractAddress}, {tokenIds: tokenIdsArray, lastUpdatedAt: Date.now() } )
        }else{
            await mongoInterface.insertOne('erc721_balances', {accountAddress: accountAddress, contractAddress: contractAddress, tokenIds: [] , lastUpdatedAt: Date.now() }   )
        }
    }

    static async addERC721TokenToAccount( accountAddress ,contractAddress , tokenId  ,mongoInterface){
        tokenId = parseInt(tokenId)
        
        let existingAccount = await mongoInterface.findOne('erc721_balances', {accountAddress: accountAddress, contractAddress: contractAddress }  )

        if(existingAccount){
            let tokenIdsArray = existingAccount.tokenIds

            if(!tokenIdsArray.includes(tokenId)){
                tokenIdsArray.push(tokenId)
            }  

            await mongoInterface.updateOne('erc721_balances', {accountAddress: accountAddress, contractAddress: contractAddress}, {tokenIds: tokenIdsArray , lastUpdatedAt: Date.now()  } )
        }else{
            await mongoInterface.insertOne('erc721_balances', {accountAddress: accountAddress, contractAddress: contractAddress, tokenIds: [tokenId] , lastUpdatedAt: Date.now()  }   )
        }
    }



    static async setOwnerOfERC721Token( accountAddress ,contractAddress , tokenId  ,mongoInterface){
        tokenId = parseInt(tokenId)
       
        let existingEntry = await mongoInterface.findOne('erc721_token', {tokenId: tokenId, contractAddress: contractAddress }  )

        if(existingEntry){ 
            await mongoInterface.updateOne('erc721_token', {tokenId: tokenId, contractAddress: contractAddress}, {accountAddress: accountAddress , lastUpdatedAt: Date.now()  } )
        }else{
            await mongoInterface.insertOne('erc721_token', {tokenId: tokenId, contractAddress: contractAddress, accountAddress: accountAddress , lastUpdatedAt: Date.now()  }   )
        }
       
        
     
    }

    static async setOwnerOfERC721Token( accountAddress ,contractAddress , tokenId  ,mongoInterface){
        tokenId = parseInt(tokenId)
       
        let existingEntry = await mongoInterface.findOne('erc721_token', {tokenId: tokenId, contractAddress: contractAddress }  )

        if(existingEntry){ 
            await mongoInterface.updateOne('erc721_token', {tokenId: tokenId, contractAddress: contractAddress}, {accountAddress: accountAddress , lastUpdatedAt: Date.now()  } )
        }else{
            await mongoInterface.insertOne('erc721_token', {tokenId: tokenId, contractAddress: contractAddress, accountAddress: accountAddress , lastUpdatedAt: Date.now()  }   )
        }
       
        
     
    }

    static async recordTransfer( from, to ,contractAddress , tokenId , blockNumber, transactionIndex ,mongoInterface){
        tokenId = parseInt(tokenId) 
         
        await mongoInterface.insertOne('erc721_transfer', {from:from, to:to, tokenId: tokenId, contractAddress: contractAddress,   blockNumber: blockNumber, transactionIndex: transactionIndex, createdAt: Date.now()  }   )
           
    }




}