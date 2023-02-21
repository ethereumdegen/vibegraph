import mongoose, { Schema, Model, InferSchemaType, model, Require_id } from 'mongoose'
 

export const EnsAddrChangedEventSchema = new Schema(
  {
   
    //namehash
    node: { type:String, required:true, index:true }, //this is 'node' in events
    
    address: { type: String, required: true },

    blockNumber: { type: String, required: true, index:true },
 
  
    lastUpdated: Number
  } 
)
  
mongoose.pluralize(null);

export type IEnsAddrChangedEvent = Require_id<
  InferSchemaType<typeof EnsAddrChangedEventSchema>
> 
export const EnsAddrChangedEvent = model<IEnsAddrChangedEvent, Model<IEnsAddrChangedEvent>>('ens_addr_changed_event', EnsAddrChangedEventSchema)
