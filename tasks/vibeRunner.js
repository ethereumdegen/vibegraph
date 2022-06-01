 
var VibeGraph = require('../index.js')

var Web3 = require('web3')

let web3Config = require('../tests/testconfig.json')

let CryptopunksABI = require( '../config/contracts/Cryptopunks.json' )
const IndexerCryptopunks = require('../indexers/IndexerCryptopunks')


 async function runVibeGraph(){
        let web3 = new Web3( web3Config.web3provider  )


       
        let vibegraphConfig = {
            contracts:[
                             //rinkeby 
                   
                    {address:"0x70BC4cCb9bC9eF1B7E9dc465a38EEbc5d73740FB", 
                    startBlock: 9228750,
                     type:"ERC721"
                    } ,
                    {address:"0xfc957dcbe0785ababa07429e4fffe8ad58bd612d", 
                    startBlock: 9463481,
                     type:"ERC721"
                    } 
              
                    ],
             
            dbName:"vibegraph_dev",
            indexRate: 10*1000,
            courseBlockGap: 8000,
            fineBlockGap: 20,
            logging:true,
            subscribe: false, 
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
  
    