
//const VibegraphIndexer = require('./VibegraphIndexer')
 import { ethers, BigNumber } from 'ethers'
import { ContractEvent } from '../src'
import VibegraphIndexer from './VibegraphIndexer'

module.exports =  class IndexerENSRegistry extends VibegraphIndexer {

   

    async onEventEmitted(event:ContractEvent){

        console.log('got emitted event ', event )
 
        let eventArgs:any = event.args 
        let registeredName = eventArgs[0]

        const labelHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(registeredName))
        const tokenId = BigNumber.from(labelHash).toString()
        

        //this works ! 
        console.log({tokenId})

       
    }

    



}