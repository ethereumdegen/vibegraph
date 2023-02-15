import { Schema, Model, InferSchemaType, model, Require_id } from 'mongoose'
 

export const EventListSchema = new Schema(
  {
    event:String ,
    address:String,
    blockHash:String,
    blockNumber:Number,
    logIndex:Number,
    removed:Boolean,
    transactionHash:String,
    transactionIndex:Number,
    id:String,
    returnValues: Object, 
    signature:String,
    raw:Object,
    hasAffectedLedger:Boolean,


  } 
)
  
export type IEventList = Require_id<
  InferSchemaType<typeof EventListSchema>
> 
export const EventList = model<IEventList, Model<IEventList>>('event_list', EventListSchema)
