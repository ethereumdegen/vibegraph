

const VibegraphIndexer = require('./VibegraphIndexer')
const web3utils = require('web3').utils
module.exports =  class IndexerBuyTheFloor extends VibegraphIndexer{



    mongoInterface

    async initialize(mongoInterface){

        if(mongoInterface){
            this.mongoInterface = mongoInterface
        }
      

    }

    async onEventEmitted(event){

        await IndexerBuyTheFloor.modifyBuyTheFloorLedgerByEvent(event,this.mongoInterface)

    }
 

    
    static async modifyBuyTheFloorLedgerByEvent(event,mongoInterface){ 
  
        let eventName = event.event   

        let outputs = event.returnValues
 
        let contractAddress = web3utils.toChecksumAddress(event.address )
        if(!eventName){
 
            console.log('WARN: unknown event in ', event.transactionHash )
            return
        }
 
        eventName = eventName.toLowerCase() 

        
        if(eventName == 'signatureburned'){
 
            let bidderAddress = web3utils.toChecksumAddress( outputs['0'] )
            let hash =   outputs['1'] .toLowerCase()
 
 
            await IndexerBuyTheFloor.modifySignatureStatus(  bidderAddress, contractAddress, hash , true, mongoInterface )
             
        }
         
        if(eventName == 'buythefloor'){
 
            let bidderAddress = web3utils.toChecksumAddress( outputs['0'] )
            let sellerAddress = web3utils.toChecksumAddress( outputs['1'] )
            let nftContractAddress = web3utils.toChecksumAddress( outputs['2'] )
            let tokenId = parseInt( outputs['3'] )
            let currencyTokenAddress = web3utils.toChecksumAddress( outputs['4'] )
            let currencyTokenAmount =   parseInt( outputs['5'] )
 
 
            await IndexerBuyTheFloor.nftSale( contractAddress,  bidderAddress, sellerAddress, nftContractAddress , tokenId, currencyTokenAddress,currencyTokenAmount, mongoInterface )
             
        }
         

    }
 

   static async modifySignatureStatus(accountAddress, contractAddress, hash, isBurned, mongoInterface){

       let collectionName = 'offchain_signatures' 

       let existing = await mongoInterface.findOne(collectionName, {hash: hash, contractAddress: contractAddress  }  )

       if(!existing){
            
           await mongoInterface.insertOne(collectionName, {accountAddress: accountAddress, hash: hash, contractAddress:contractAddress, burned: isBurned }   )
       }
   }

   
   static async nftSale( contractAddress,  bidderAddress, sellerAddress, nftContractAddress , tokenId, currencyTokenAddress,currencyTokenAmount, mongoInterface ){

    let collectionName = 'nft_sale'
    
    let uniqueHash = web3utils.soliditySha3( contractAddress,  bidderAddress, sellerAddress, nftContractAddress , tokenId, currencyTokenAddress,currencyTokenAmount )

    let existing = await mongoInterface.findOne(collectionName, {uniqueHash: uniqueHash}  )

    if(!existing){
         
        await mongoInterface.insertOne(collectionName, { uniqueHash: uniqueHash,contractAddress:contractAddress, bidderAddress: bidderAddress, sellerAddress:sellerAddress, nftContractAddress: nftContractAddress, tokenId:tokenId, currencyTokenAddress:currencyTokenAddress, currencyTokenAmount: currencyTokenAmount  }   )
    }
}



}