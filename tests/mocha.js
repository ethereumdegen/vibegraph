var expect    = require("chai").expect;

var TinyFox = require('../index.js')

var Web3 = require('web3')

let web3Config = require('./testconfig.json')


describe("Tinyfox Data Collector", function() {
 
    it("starts tinyfox", async function() {
        
        let web3 = new Web3( web3Config.web3provider  )

        let tinyfoxConfig = {
            contractAddress:"0xab89a7742cb10e7bce98540fd05c7d731839cf9f",
            startBlock:1316824,
            suffix:"0xBTC_test",
            contractType: 'ERC20', 
             courseBlockGap: 10000,
             logging:true,
        }

        let tinyFox = new TinyFox()
        await tinyFox.init( {suffix: tinyfoxConfig.suffix} )
        tinyFox.startIndexing( web3, tinyfoxConfig )  

        

    });
  
   
       
  });

