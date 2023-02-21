
//const VibegraphIndexer = require('./VibegraphIndexer')
 import { ethers, BigNumber } from 'ethers'
import { EnsAddrChangedEvent } from '../models/tokens/ens_addr_changed_event'
import { EnsDomain, IEnsDomain } from '../models/tokens/ens_domain'
import { SetEnsResolverEvent } from '../models/tokens/set_ens_resolver_event'
import { ContractEvent } from '../src'
import VibegraphIndexer from './VibegraphIndexer'
 
module.exports =  class IndexerENSResolver extends VibegraphIndexer {
   
    async onEventEmitted(event:ContractEvent){


 
        let eventArgs:any = event.args 
        let blockNumber = event.blockNumber


        if(event.name=='AddrChanged'){  

             console.log('got emitted event ', event )

            const node = eventArgs[0]
            const address = eventArgs[1]


            //all resolvers MUST TRIGGER THIS EVENT !! this is the key - the secret sauce 
            //event AddrChanged(bytes32 indexed node, address a);

            let created = await EnsAddrChangedEvent.create({
                node,
                address,
                blockNumber
            })


        }

      /*  console.log('got emitted event ', event )
 
        let eventArgs:any = event.args 
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
        */
    }

 
}