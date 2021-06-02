
const web3utils = require('web3').utils


module.exports =  class IndexerERC721 {

    static async modifyLedgerByEvent(event,mongoInterface){

        await IndexerERC721.modifyERC721LedgerByEvent(event,mongoInterface)

    }

 

  

    static async modifyERC721LedgerByEvent(event,mongoInterface){
        
        let eventName = event.event 

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

            await IndexerERC721.removeERC721TokenFromAccount( from ,contractAddress , tokenId  ,mongoInterface )
            await IndexerERC721.addERC721TokenToAccount( to ,contractAddress , tokenId  ,mongoInterface) 
        }

        if(eventName == 'transfersingle' ){
            let from = web3utils.toChecksumAddress(outputs._from )
            let to = web3utils.toChecksumAddress(outputs._to )
            let tokenId = parseInt(outputs._id)

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

            await mongoInterface.updateOne('erc721_balances', {accountAddress: accountAddress, contractAddress: contractAddress}, {tokenIds: tokenIdsArray} )
        }else{
            await mongoInterface.insertOne('erc721_balances', {accountAddress: accountAddress, contractAddress: contractAddress, tokenIds: [] }   )
        }
    }

    static async addERC721TokenToAccount( accountAddress ,contractAddress , tokenId  ,mongoInterface){
        tokenId = parseInt(tokenId)
        
        let existingAccount = await mongoInterface.findOne('erc721_balances', {accountAddress: accountAddress, contractAddress: contractAddress }  )

        if(existingAccount){
            let tokenIdsArray = existingAccount.tokenIds

            tokenIdsArray.push(tokenId)

            await mongoInterface.updateOne('erc721_balances', {accountAddress: accountAddress, contractAddress: contractAddress}, {tokenIds: tokenIdsArray} )
        }else{
            await mongoInterface.insertOne('erc721_balances', {accountAddress: accountAddress, contractAddress: contractAddress, tokenIds: [tokenId] }   )
        }
    }




}