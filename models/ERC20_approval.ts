import mongoose, { Schema, Model, InferSchemaType, model, Require_id } from 'mongoose'
 

export const ERC20ApprovalSchema = new Schema(
  {
    contractAddress: { type: String, required: true, index: true },
    ownerAddress: { type: String, required: true, index: true },
    spenderAddress: { type: String, required: true, index: true },

    amount: { type: Number  },
    lastUpdatedAt:Number 
  } 
)
 
 
mongoose.pluralize(null);

export type IERC20Approval = Require_id<
  InferSchemaType<typeof ERC20ApprovalSchema>
> 
export const ERC20Approval = model<IERC20Approval, Model<IERC20Approval>>('erc20_approval', ERC20ApprovalSchema)
