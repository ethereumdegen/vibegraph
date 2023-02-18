 
 
import Vibegraph, { VibegraphConfig } from '../src/index'

let web3Config = require('../tests/testconfig.json')

let IndexerENSRegistry = require( '../indexers/IndexerENSRegistry' )
let IndexerENSRegistrarController = require( '../indexers/IndexerENSRegistrarController' )
 
let EnsRegistrarControllerABI = require( '../config/contracts/ENSRegistrarController.json' )
let EnsRegistryABI = require( '../config/contracts/ENSRegistry.json' )
 
 

 async function runVibeGraph(){
            
            
        let indexerENSRegistry = new IndexerENSRegistry(  )
        let indexerENSRegistrarController = new IndexerENSRegistrarController(  )

        
        let vibegraphConfig:VibegraphConfig = {
            contracts:[
                    //mainnet 
                   
                    {
                     address:"0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e", 
                     startBlock: 9380380,
                     type:"EnsRegistry"
                    } ,
                    {
                    address:"0x283af0b28c62c092c9727f1ee09c02ca627eb7f5", 
                    startBlock: 9380471,
                    type:"EnsRegistrarController"
                    } 
              
                    ],
             
            dbName:"vibegraph_dev",
            indexRate: 1*1000,
            courseBlockGap: 8000,
            updateBlockNumberRate: 60*1000,
            fineBlockGap: 20,
            logLevel:'debug',
            subscribe: true, 
            customIndexers:[{
                type:'EnsRegistry', 
                abi: EnsRegistryABI ,  
                handler: indexerENSRegistry
             },
             {
                type:'EnsRegistrarController', 
                abi: EnsRegistrarControllerABI ,  
                handler: indexerENSRegistrarController
             }],
            web3ProviderUri: web3Config.web3provider
        }

        let vibegraph = new Vibegraph()
        await vibegraph.init( vibegraphConfig )
        vibegraph.startIndexing(  )  

        

    } 


    runVibeGraph()
  
    