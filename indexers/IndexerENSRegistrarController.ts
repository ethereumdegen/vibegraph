
//const VibegraphIndexer = require('./VibegraphIndexer')
 import { ethers, BigNumber } from 'ethers'
import { EnsDomain, IEnsDomain } from '../models/tokens/ens_domain'
import { ContractEvent } from '../src'
import VibegraphIndexer from './VibegraphIndexer'

var namehash = require('@ensdomains/eth-ens-namehash')

https://eips.ethereum.org/EIPS/eip-137#namehash-algorithm

module.exports =  class IndexerENSRegistry extends VibegraphIndexer {
   
    async onEventEmitted(event:ContractEvent){

        console.log('got emitted event ', event )
 
        let eventArgs:any = event.args 


        if(event.name=='NameRegistered'){
            let registeredName = eventArgs[0]

            const labelHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(registeredName))
            const tokenId = BigNumber.from(labelHash).toString()
            
    
            //this works ! 
            console.log({tokenId})
    
            const newDomain:Omit<IEnsDomain,'_id'> = {
                contractAddress: event.address,
                tokenId,
                name: registeredName,
                label: labelHash,
                node: namehash.hash(`${registeredName}.eth`),
              //  resolverAddress: undefined  //?
            }
            let created = await EnsDomain.create(newDomain)
    
        }
       
    }

 
}