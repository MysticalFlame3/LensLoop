import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
    {
        content:{
            type:String,
            ref: "Video"
        },
        video:{
            type:Schema.Types.ObjectId,
            ref:"Video"
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }
        
    },
    {timestamps:true}
)

commentSchema.plugin(mongooseAggregatePaginate)
export const Comment = moongoose.model("Comment",commentSchema)
