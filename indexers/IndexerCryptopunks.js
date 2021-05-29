
const web3utils = require('web3').utils


module.exports =  class IndexerERC721 {

    static async modifyLedgerByEvent(event,mongoInterface){

        await IndexerERC721.modifyCryptopunkLedgerByEvent(event,mongoInterface)

    }

  

    static async modifyCryptopunkLedgerByEvent(event,mongoInterface){
        
        let eventName = event.event 

        if(!eventName){
            console.log('WARN: unknown event in ', event.transactionHash )
            return 
        }
        eventName = eventName.toLowerCase()
        

        let outputs = event.returnValues
 
        let contractAddress = web3utils.toChecksumAddress(event.address)
       
        //event Assign(uint indexed punkIndex, uint value, address indexed fromAddress, address indexed toAddress);
       
        if(eventName == 'assign' ){
            
            let from = contractAddress
            let to = web3utils.toChecksumAddress(outputs['0'] )
            let tokenId = outputs['1'] 
            

            await IndexerERC721.removeCryptopunkFromAccount( from ,contractAddress , tokenId  ,mongoInterface )
            await IndexerERC721.addCryptopunkToAccount( to ,contractAddress , tokenId  ,mongoInterface) 
        }
        
        //event PunkBought(uint indexed punkIndex, uint value, address indexed fromAddress, address indexed toAddress);
       
        if(eventName == 'punkbought' ){
            let tokenId = outputs['0'] 
            let from = web3utils.toChecksumAddress(outputs['2'] )
            let to = web3utils.toChecksumAddress(outputs['3'] )
            

            await IndexerERC721.removeCryptopunkFromAccount( from ,contractAddress , tokenId  ,mongoInterface )
            await IndexerERC721.addCryptopunkToAccount( to ,contractAddress , tokenId  ,mongoInterface) 
        }

        //event PunkTransfer(address indexed from, address indexed to, uint256 punkIndex);
        if(eventName == 'punktransfer' ){
            let from = web3utils.toChecksumAddress(outputs['0'] )
            let to = web3utils.toChecksumAddress(outputs['1'] )
            let tokenId =  outputs['2']

            await IndexerERC721.removeCryptopunkFromAccount( from ,contractAddress , tokenId  ,mongoInterface )
            await IndexerERC721.addCryptopunkToAccount( to ,contractAddress , tokenId  ,mongoInterface ) 
        }
       
    }

    static async removeCryptopunkFromAccount( accountAddress ,contractAddress , tokenId ,mongoInterface ){
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

    static async addCryptopunkToAccount( accountAddress ,contractAddress , tokenId  ,mongoInterface){
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