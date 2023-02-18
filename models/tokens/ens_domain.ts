import mongoose, { Schema, Model, InferSchemaType, model, Require_id } from 'mongoose'
 

export const EnsDomainSchema = new Schema(
  {
    contractAddress: { type: String, required: true, index: true },

    tokenId: { type: String, required: true, index: true, unique:true  },
    label: { type: String, required: true, index: true }, //this is 'label' in events

    name: { type: String, required: true, index: true, unique:true  },

    //namehash
    node: { type:String, required:true, index:true }, //this is 'node' in events
    
    resolverAddress: { type: String },


    //label 
    //node 


  
    lastUpdated: Number
  } 
)
 
//ContractStateSchema.index({ contractAddress: 1, tokenId: 1 }, { unique: true })

mongoose.pluralize(null);

export type IEnsDomain = Require_id<
  InferSchemaType<typeof EnsDomainSchema>
> 
export const EnsDomain = model<IEnsDomain, Model<IEnsDomain>>('ens_domain', EnsDomainSchema)
