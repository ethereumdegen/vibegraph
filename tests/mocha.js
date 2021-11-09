var expect    = require("chai").expect;

var VibeGraph = require('../index.js')

var Web3 = require('web3')

let web3Config = require('./testconfig.json')


describe("Vibegraph Data Collector", function() {
 
    it("starts vibegraph", async function() {
        
        let web3 = new Web3( web3Config.web3provider  )

        let vibegraphConfig = {
            contracts:[{
                //goerli
                 address:"0xab89a7742cb10e7bce98540fd05c7d731839cf9f",
                 startBlock:1316824,
                 type:'ERC20'

            }],
            
            dbName:"vibegraph_test",
            indexRate: 10*1000,
            courseBlockGap: 8000,
            fineBlockGap: 20,
            logging:true,
        }

        let vibegraph = new VibeGraph()
        await vibegraph.init( vibegraphConfig )
        //vibegraph.startIndexing( web3, vibegraphConfig )  

        

    });
  
   
       
  });

