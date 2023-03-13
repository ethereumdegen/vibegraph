import mongoose, { Schema, Model, InferSchemaType, model, Require_id } from 'mongoose'
 

export const ERC721TransferSchema = new Schema(
  {
    contractAddress: { type: String, required: true, index: true },
    from: { type: String, required: true, index: true },
    to: { type: String, required: true, index: true },

    tokenId: { type: Number  },
    blockNumber: { type: Number  },
    transactionIndex: { type: Number  },
    createdAt:Number 
  } 
)
 
//ContractStateSchema.index({ contractAddress: 1, tokenId: 1 }, { unique: true })

mongoose.pluralize(null);

export type IERC721Transfer = Require_id<
  InferSchemaType<typeof ERC721TransferSchema>
> 
export const ERC721Transfer = model<IERC721Transfer, Model<IERC721Transfer>>('erc721_transfer', ERC721TransferSchema)
