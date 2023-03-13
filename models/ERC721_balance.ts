import mongoose, { Schema, Model, InferSchemaType, model, Require_id } from 'mongoose'
 

export const ERC721BalanceSchema = new Schema(
  {
    contractAddress: { type: String, required: true, index: true },
    accountAddress: { type: String, required: true, index: true },

    tokenIds: { type: Array  },
    lastUpdatedAt:Number 
  } 
)
 
//ContractStateSchema.index({ contractAddress: 1, tokenId: 1 }, { unique: true })

mongoose.pluralize(null);

export type IERC721Balance = Require_id<
  InferSchemaType<typeof ERC721BalanceSchema>
> 
export const ERC721Balance = model<IERC721Balance, Model<IERC721Balance>>('erc721_balances', ERC721BalanceSchema)
