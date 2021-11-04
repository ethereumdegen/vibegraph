var expect    = require("chai").expect;

var VibeGraph = require('../index.js')

var Web3 = require('web3')

let web3Config = require('./testconfig.json')


describe("Vibegraph Data Collector", function() {
 
    it("starts vibegraph", async function() {
        
        let web3 = new Web3( web3Config.web3provider  )

        let vibegraphConfig = {
            contractAddress:"0xab89a7742cb10e7bce98540fd05c7d731839cf9f",
            startBlock:1316824,
            dbName:"vibegraph__test",
            contractType: 'ERC20', 
             courseBlockGap: 10000,
             logging:true,
        }

        let vibegraph = new VibeGraph()
        await vibegraph.init( vibegraphConfig )
        vibegraph.startIndexing( web3, vibegraphConfig )  

        

    });
  
   
       
  });

