 
var VibeGraph = require('../index.js')

var Web3 = require('web3')

let web3Config = require('./testconfig.json')

let CryptopunksABI = require( '../config/contracts/Cryptopunks.json' )
const IndexerCryptopunks = require('../indexers/IndexerCryptopunks')


 async function runVibeGraph(){
        let web3 = new Web3( web3Config.web3provider  )


       
        let vibegraphConfig = {
            contracts:[
                             //goerli 
                    {address:"0x8a4c85478568ec5284301eaa0ddfd06c0ed73323", 
                    startBlock: 4876534,
                     type:"Cryptopunks"
                    } 
              
                    ],
             
            dbName:"vibegraph_dev",
            indexRate: 10*1000,
            courseBlockGap: 8000,
            fineBlockGap: 20,
            logging:true,
            subscribe: true, 
            customIndexers:[{
                type:'Cryptopunks', 
                abi: CryptopunksABI ,  
                handler: IndexerCryptopunks
             }]
        }

        let vibegraph = new VibeGraph()
        await vibegraph.init( vibegraphConfig )
        vibegraph.startIndexing( web3, vibegraphConfig )  

        

    } 


    runVibeGraph()
  
    