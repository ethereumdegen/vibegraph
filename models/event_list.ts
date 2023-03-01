import mongoose, { Schema, Model, InferSchemaType, model, Require_id } from 'mongoose'
 

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
  
export type IEventList = Require_id<
  InferSchemaType<typeof EventListSchema>
> 
export const EventList = model<IEventList, Model<IEventList>>('event_list', EventListSchema)
