import mongoose, { Schema, Model, InferSchemaType, model, Require_id } from 'mongoose'
 

export const EnsNewOwnerEventSchema = new Schema(
  {
   
    //namehash
    node: { type:String, required:true, index:true }, //this is 'node' in events
    
    label: { type: String, required: true },

    address: { type: String, required: true },

    blockNumber: { type: String, required: true, index:true },
 
  
    lastUpdated: Number
  } 
)
  
mongoose.pluralize(null);

export type IEnsNewOwnerEvent = Require_id<
  InferSchemaType<typeof EnsNewOwnerEventSchema>
> 
export const EnsNewOwnerEvent = model<IEnsNewOwnerEvent, Model<IEnsNewOwnerEvent>>('ens_new_owner_event', EnsNewOwnerEventSchema)
