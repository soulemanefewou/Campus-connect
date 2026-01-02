import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getComments = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .order("desc")
      .collect();

    return await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        
        // Check if current user liked this comment
        let userLiked = false;
        let likeCount = 0;
        
        const identity = await ctx.auth.getUserIdentity();
        if (identity) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
                .first();
            if (user) {
                 const like = await ctx.db
                    .query("likes")
                    .withIndex("by_target", (q) => q.eq("targetType", "comment").eq("targetId", comment._id))
                    .filter(q => q.eq(q.field("userId"), user._id))
                    .first();
                 userLiked = !!like;
            }
        }

        const likes = await ctx.db
             .query("likes")
             .withIndex("by_target", (q) => q.eq("targetType", "comment").eq("targetId", comment._id))
             .collect();
        likeCount = likes.length;

        return {
          ...comment,
          author: author
            ? {
                username: author.username,
                avatarUrl: author.avatarUrl,
              }
            : null,
          likes: likeCount,
          userLiked,
        };
      })
    );
  },
});

export const createComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.insert("comments", {
        content: args.content,
        postId: args.postId,
        authorId: user._id,
        createdAt: Date.now(),
    });
  },
});

export const toggleLike = mutation({
    args: { commentId: v.id("comments") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        const existingLike = await ctx.db
            .query("likes")
            .withIndex("by_target", (q) => q.eq("targetType", "comment").eq("targetId", args.commentId))
            .filter(q => q.eq(q.field("userId"), user._id))
            .first();

        if (existingLike) {
            await ctx.db.delete(existingLike._id);
        } else {
            await ctx.db.insert("likes", {
                userId: user._id,
                targetType: "comment",
                targetId: args.commentId,
                createdAt: Date.now(),
            });
        }
    }
});
