import mongoose, { Schema, Model, InferSchemaType, model, Require_id } from 'mongoose'
 

export const EventListSchema = new Schema(
  {
    name:{type:String,required:true},
    address:{type:String,required:true},
    blockHash:String,
    blockNumber:{type:Number,required:true},
    logIndex:Number,
    removed:Boolean,
    transactionHash:String,
    transactionIndex:Number,
    id:String,
    //returnValues: Object, 
    args: Object,
    signature:String,
    raw:Object,
    hasAffectedLedger:Boolean,


  } 
)

mongoose.pluralize(null);
  
export type IEventList = Require_id<
  InferSchemaType<typeof EventListSchema>
> 
export const EventList = model<IEventList, Model<IEventList>>('event_list', EventListSchema)
