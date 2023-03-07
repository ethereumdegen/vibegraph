var expect    = require("chai").expect;
 

import Vibegraph, { VibegraphConfig } from '../src/index'

 

let web3Config = require('./testconfig.json')


let IndexerERC20 = require("../indexers/IndexerERC20")
let ERC20ABI = require("../config/contracts/ERC20ABI.json")


describe("Vibegraph Data Collector", function() {
 
    it("starts vibegraph and does setup callback", async function() {
        
       
       
        let vibegraphConfig:VibegraphConfig= {
            contracts:[{
                //goerli
                 address:"0xab89a7742cb10e7bce98540fd05c7d731839cf9f",
                 startBlock:1316824,
                 type:'ERC20'

            }],
            
            dbName:"vibegraph_test",
            indexRate: 10*1000,
            courseBlockGap: 8000,
            updateBlockNumberRate: 60*1000,
            fineBlockGap: 20,
            logLevel: 'debug' ,
            subscribe: true, 
            customIndexers:[{
                type:"ERC20",
                abi: ERC20ABI,
                handler: IndexerERC20
            }],

            web3ProviderUri: web3Config.web3provider
        }

        let vibegraph = new Vibegraph()
        await vibegraph.init( vibegraphConfig )
         
        await vibegraph.indexData() 
        
        await vibegraph.updateLedger()  
         
    });
  
   
       
  });

