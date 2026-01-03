import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const send = mutation({
  args: {
    body: v.string(),
    image: v.optional(v.string()),
    communityId: v.id("communities"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Vérifier si l'utilisateur est membre de la communauté (optionnel, mais recommandé)
    const isMember = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", user._id))
        .filter((q) => q.eq(q.field("targetType"), "community"))
        .filter((q) => q.eq(q.field("targetId"), args.communityId))
        .first();

    if (!isMember) throw new Error("You must join the community to post messages.");

    await ctx.db.insert("messages", {
      body: args.body,
      image: args.image,
      communityId: args.communityId,
      userId: user._id,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
      .order("desc") // Plus récents en premier (pour pagination future), mais chat souvent affiché inversé
      .take(50);

    // Enrichir avec les infos de l'auteur
    const messagesWithAuthor = await Promise.all(
        messages.map(async (msg) => {
            const author = await ctx.db.get(msg.userId);
            let imageUrl = undefined;
            if (msg.image) {
                imageUrl = await ctx.storage.getUrl(msg.image) || undefined;
            }
            return {
                ...msg,
                image: imageUrl, // URL signée
                author: author ? {
                    username: author.username,
                    avatarUrl: author.avatarUrl,
                    _id: author._id
                } : null
            };
        })
    );

    return messagesWithAuthor.reverse(); // Renvoyer dans l'ordre chronologique pour le chat
  },
});