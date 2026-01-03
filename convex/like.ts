import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const vote = mutation({
  args: {
    targetId: v.union(v.id("posts"), v.id("comments")),
    targetType: v.union(v.literal("post"), v.literal("comment")),
    voteType: v.union(v.literal("like"), v.literal("dislike")),
    clerkId: v.string(), // Ajouter clerkId
  },
  handler: async (ctx, args) => {
    // Vérifier que l'ID Clerk est fourni
    if (!args.clerkId) {
      throw new Error("Unauthenticated");
    }

    // Trouver l'utilisateur par son clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const existingVote = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("targetType"), args.targetType),
          q.eq(q.field("targetId"), args.targetId)
        )
      )
      .first();

    if (existingVote) {
      if (existingVote.type === args.voteType) {
        // Toggle off if clicking same vote
        await ctx.db.delete(existingVote._id);
      } else {
        // Switch vote type
        await ctx.db.patch(existingVote._id, { type: args.voteType });
      }
    } else {
      // Create new vote
      await ctx.db.insert("likes", {
        userId: user._id,
        targetType: args.targetType,
        targetId: args.targetId,
        type: args.voteType,
        createdAt: Date.now(),
      });
    }
  },
});