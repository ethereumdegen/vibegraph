import mongoose, { Schema, Model, InferSchemaType, model, Require_id } from 'mongoose'
 

export const ERC721TokenSchema = new Schema(
  {
    contractAddress: { type: String, required: true, index: true },
    accountAddress: { type: String, required: true, index: true },
    tokenId: { type: Number, required: true, index: true },
 
    lastUpdatedAt:Number 
  } 
)
  
mongoose.pluralize(null);

export type IERC721Token = Require_id<
  InferSchemaType<typeof ERC721TokenSchema>
> 
export const ERC721Token = model<IERC721Token, Model<IERC721Token>>('erc721_token', ERC721TokenSchema)
