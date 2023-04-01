import mongoose, { Schema, Model, InferSchemaType, model, Require_id } from 'mongoose'
 

import {getDatabaseName} from "../src/lib/app-helper"


const dbName = getDatabaseName()


export const EventListSchema = new Schema(
  {
    name:{type:String,required:true,index:true},
    address:{type:String,required:true,index:true},
    blockHash:String,
    blockNumber:{type:Number,required:true},
    logIndex:Number,
    removed:Boolean,
    transactionHash:{type:String,required:true},
    transactionIndex:Number,
    id:String,
    //returnValues: Object, 
    args: Object,
    signature:String,
    raw:Object,


    hasAffectedLedger:{type:Boolean,default:false,index:true},
    errorAffectingLedger:{type:Boolean,default:false,index:true},




  } 
)


EventListSchema.index({ transactionHash: 1, logIndex: 1 }, { unique: true })




mongoose.pluralize(null);


let dbConnection = mongoose.connection.useDb(dbName)

  
export type IEventList = Require_id<
  InferSchemaType<typeof EventListSchema>
> 
export const EventList = dbConnection.model<IEventList, Model<IEventList>>('event_list', EventListSchema)
