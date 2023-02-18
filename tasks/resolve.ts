 
import { ethers, BigNumber } from 'ethers'

let web3Config = require('../tests/testconfig.json')

let IndexerENSRegistry = require( '../indexers/IndexerENSRegistry' )
 
let EnsRegistryABI = require( '../config/contracts/ENSRegistrarController.json' )
 
 
var namehash = require('@ensdomains/eth-ens-namehash')


 async function resolve(){
         
        
        let name = '8469'

        const labelHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name)) //this is 'label'
        const tokenId = BigNumber.from(labelHash).toString()  //this is 'id'

        console.log({labelHash})
        console.log({tokenId})


        //what is the node ?  its the namehash
        const nameHash = namehash.hash(`${name}.eth`)
        console.log({nameHash})
    } 


    resolve()
  
    