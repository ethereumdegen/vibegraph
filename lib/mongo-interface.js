

const mongodb = require('mongodb')
let MongoClient = mongodb.MongoClient;
 

 module.exports =  class MongoInterface  {

    constructor( ){
       
    }

    async init( dbName , mongoConnectURI )
    {
     
      let host = 'localhost'
      let port = 27017

      
      let url = mongoConnectURI ? mongoConnectURI : "mongodb://"+host+":"+port

      if(!dbName)
      {
        throw new Error("Vibegraph : no db name specified ")
      }
       

      let options = { useUnifiedTopology: true   }

      var database = await new Promise(function(resolve, reject) {
        MongoClient.connect(url, options, function(err, db) {
              if (err) console.trace(err);
                this.dbo = db.db( dbName );

                console.log('Mongo connect: ', url , "  ", dbName)
                //test
                //self.insertOne('stats',{'hashrate':1000})
                resolve(this.dbo)
            }.bind(this));
        }.bind(this));

      //  if(config && config.apiMode == true) return //do not make indexes if api mode

        await this.createCollectionUniqueIndexes()
    } 


   async createCollectionUniqueIndexes()
    {

      await this.createDualIndexOnCollection('event_data', 'contractAddress', 'startBlock')
      await this.createUniqueDualIndexOnCollection('event_list', 'transactionHash', 'logIndex')

      

    }



    async createIndexOnCollection(collectionName, indexColumnName)
    {
      this.dbo.collection(collectionName).createIndex( { [`${indexColumnName}`]: 1 }, { unique: false } )
    }

    async createUniqueIndexOnCollection(collectionName, indexColumnName)
    {
      this.dbo.collection(collectionName).createIndex( { [`${indexColumnName}`]: 1 }, { unique: true } )
    }

    async createDualIndexOnCollection(collectionName, indexColumnNameA, indexColumnNameB)
    {
      this.dbo.collection(collectionName).createIndex( { [`${indexColumnNameA}`]: 1,  [`${indexColumnNameB}`]: 1 }, { unique: false } )
    }

    async createUniqueTripleIndexOnCollection(collectionName, indexColumnNameA, indexColumnNameB, indexColumnNameC)
    {
      this.dbo.collection(collectionName).createIndex( { [`${indexColumnNameA}`]: 1,  [`${indexColumnNameB}`]: 1 , [`${indexColumnNameC}`]: 1}, { unique: true } )
    }


    async createUniqueDualIndexOnCollection(collectionName, indexColumnNameA, indexColumnNameB)
    {
      this.dbo.collection(collectionName).createIndex( { [`${indexColumnNameA}`]: 1,  [`${indexColumnNameB}`]: 1 }, { unique: true } )
    }


    //allowed to be undefined or unique  (not null!)
    async createUniqueSparseDualIndexOnCollection(collectionName, indexColumnNameA, indexColumnNameB)
    {
      this.dbo.collection(collectionName).createIndex( { [`${indexColumnNameA}`]: 1,  [`${indexColumnNameB}`]: 1 }, {  sparse:true, unique: true  } )
    }

    async shutdown()
    {
      //mongoClient.disconnect()
    }


    /*
    TODO:  Should replace all the below with mongoose commands
    */


    async insertOne(collectionName,obj)
    {
    //  var myobj = { name: "Company Inc", address: "Highway 37" };
      return new Promise(function(resolve, reject) {
          this.dbo.collection(collectionName).insertOne(obj, function(err, res) {
            if (err) reject(err);
          //  console.log("1 inserted ",collectionName);
            resolve(res);
          });
      }.bind(this));

    }

    async insertMany(collectionName,array)
    {
    
      return new Promise(function(resolve, reject) {
          this.dbo.collection(collectionName).insertMany(array, {ordered:false}, function(err, res) {
            if (err) reject(err);
          
            resolve(res);
          });
      }.bind(this));

    }


    //obviously dont do this in production..
    async dropCollection(collectionName)
    {


      return new Promise(function(resolve, reject) {

        this.dbo.collection(collectionName).drop( function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      }.bind(this));

    }

    //returns the original row instead of inserted id
   async findOneAndUpdate(collectionName,query,newvalues)
    {
      let options= {returnOriginal:true}//default
      var setvalues = { $set: newvalues }

      return new Promise(function(resolve, reject) {

        this.dbo.collection(collectionName).findOneAndUpdate(query,setvalues,options,function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      }.bind(this));

    }

      //returns the updated row
    async updateAndFindOne(collectionName,query,newvalues)
     {
       let options= {returnOriginal:false} //give us the new record not the original
       var setvalues = { $set: newvalues }

       return new Promise(function(resolve, reject) {

         this.dbo.collection(collectionName).findOneAndUpdate(query,setvalues,options,function(err, res) {
            if (err) reject(err);
            resolve(res);
          });


       }.bind(this));

     }

     //useful to do 'unset' which is useful to clear out for partial filter indexes
     async updateCustomAndFindOne(collectionName,query, setvalues )
      {
        let options= {returnOriginal:false} //give us the new record not the original
      //  var setvalues = { $set: newvalues }

        return new Promise(function(resolve, reject) {

          this.dbo.collection(collectionName).findOneAndUpdate(query,setvalues,options,function(err, res) {
             if (err) reject(err);
             resolve(res);
           });


        }.bind(this));

      }



    async updateMany(collectionName,query,newvalues)
    {

      //this is clunky and not thread safe -- will overwrite all fields
      var setvalues = { $set: newvalues }

      return new Promise(function(resolve, reject) {

        this.dbo.collection(collectionName).updateMany(query,setvalues,function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      }.bind(this));

    }

    async updateOne(collectionName,query,newvalues)
    {

      //this is clunky and not thread safe -- will overwrite all fields
      var setvalues = { $set: newvalues }

      return new Promise(function(resolve, reject) {

        this.dbo.collection(collectionName).updateOne(query,setvalues,function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      }.bind(this));

    }

    async upsertOne(collectionName,query,newvalues)
    {


      var setvalues = { $set: newvalues }

      var existing = await this.findOne(collectionName,query)
      if(existing)
      {
        return await this.updateOne(collectionName,query,newvalues)
      }else {
        return await this.insertOne(collectionName,newvalues)
      }

    /*  return new Promise(function(resolve, reject) {

        this.dbo.collection(collectionName).updateOne(query,setvalues,{upsert: true},function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      });*/

    }

    async deleteOne(collectionName,query)
    {
      return new Promise(function(resolve, reject) {
          this.dbo.collection(collectionName).deleteOne(query, function(err, res) {
            if (err) reject(err);
          //  console.log("1 inserted ",collectionName);
            resolve(res);
          });
        }.bind(this));


    }

    async deleteMany(collectionName,query)
    {
      return new Promise(function(resolve, reject) {
          this.dbo.collection(collectionName).deleteMany(query, function(err, res) {
            if (err) reject(err);
          //  console.log("1 inserted ",collectionName);
            resolve(res);
          });
      }.bind(this));

    }

    async dropDatabase( )
    {
      return new Promise(function(resolve, reject) {
          this.dbo.dropDatabase( function(err, res) {
            if (err) reject(err);
          //  console.log("1 inserted ",collectionName);
            resolve(res);
          });
      }.bind(this));


    }

    async findById(collectionName,id)
    {

      var o_id = new mongo.ObjectID( id );

      return this.findOne(collectionName, o_id)

    }

     
    async findOne(collectionName,query)
    {
    //  var query = { address: "Park Lane 38" };
    //  var filter = { _id: 0, name: 1, address: 1 };
      return new Promise(function(resolve, reject) {

        this.dbo.collection(collectionName).findOne(query,function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      }.bind(this));

    }

    async findAll(collectionName,query,outputFields)
    {
    //  var query = { address: "Park Lane 38" };
    //  var filter = { _id: 0, name: 1, address: 1 };
      return new Promise(function(resolve, reject) {

        this.dbo.collection(collectionName).find(query, outputFields).toArray(function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      }.bind(this));

    }

    async findAllWithLimit(collectionName,query,limit)
    {
    //  var query = { address: "Park Lane 38" };
    //  var filter = { _id: 0, name: 1, address: 1 };
      return new Promise(function(resolve, reject) {

        this.dbo.collection(collectionName).find(query).limit(limit).toArray(function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      }.bind(this));

    }




    async findAllSorted(collectionName,query,sortBy)
    {
     
      return new Promise(function(resolve, reject) {

        this.dbo.collection(collectionName).find(query).sort(sortBy).toArray(function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      }.bind(this));

    }

    async findAllSortedWithLimit(collectionName,query,sortBy,limit)
    {
     
      return new Promise(function(resolve, reject) {

        this.dbo.collection(collectionName).find(query).sort(sortBy).limit(limit).toArray(function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      }.bind(this));

    }

     getMongoClient()
     {
       return mongoClient;
     }



}
