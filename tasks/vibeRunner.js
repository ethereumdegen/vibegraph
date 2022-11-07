 
var VibeGraph = require('../index.js')


let web3Config = require('../tests/testconfig.json')

let IndexerERC721 = require( '../indexers/IndexerERC721' )
 
let ERC721ABI = require( '../config/contracts/SuperERC721ABI.json' )
let ERC20ABI = require( '../config/contracts/SuperERC20ABI.json' ) 
let ERC1155ABI = require( '../config/contracts/SuperERC1155ABI.json' )


//let CryptopunksABI = require( '../config/contracts/Cryptopunks.json' )
//const IndexerCryptopunks = require('../indexers/IndexerCryptopunks')


 async function runVibeGraph(){
        

        const mockMongoInterface = {

            findOne: function(){
                console.log('Mock Mongo: Find One')
                return {id:0}
            },
            insertOne: function(){
                console.log('Mock Mongo: Insert One')
                return {id:0}
            },
            updateOne: function(){
                console.log('Mock Mongo: Update One')
                return {id:0}
            }
        }
        
        let indexerErc721 = new IndexerERC721( mockMongoInterface )

       
        let vibegraphConfig = {
            contracts:[
                             //goerli 
                   
                    {address:"0x305305c40d3de1c32f4c3d356abc72bcc6dcf9dc", 
                    startBlock: 7492823,
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
                type:'ERC721', 
                abi: ERC721ABI ,  
                handler: indexerErc721
             }],
             web3ProviderUri: web3Config.web3provider
        }

        let vibegraph = new VibeGraph()
        await vibegraph.init( vibegraphConfig )
        vibegraph.startIndexing( vibegraphConfig )  

        

    } 


    runVibeGraph()
  
    