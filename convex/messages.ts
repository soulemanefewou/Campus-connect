import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Table temporaire pour les états "en train d'écrire"
export const typing = mutation({
  args: {
    communityId: v.id("communities"),
    clerkId: v.string(),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    // Créer un identifiant unique pour chaque utilisateur dans chaque communauté
    const typingId = `${args.communityId}-${user._id}`;
    
    // Vérifier si l'utilisateur est déjà en train d'écrire
    const existingTyping = await ctx.db
      .query("typingIndicators")
      .filter((q) => q.eq(q.field("typingId"), typingId))
      .first();

    if (args.isTyping) {
      if (existingTyping) {
        // Mettre à jour le timestamp
        await ctx.db.patch(existingTyping._id, {
          lastTyping: Date.now(),
        });
      } else {
        // Créer un nouvel indicateur
        await ctx.db.insert("typingIndicators", {
          typingId,
          userId: user._id,
          communityId: args.communityId,
          lastTyping: Date.now(),
          username: user.username,
        });
      }
    } else if (existingTyping) {
      // Supprimer l'indicateur
      await ctx.db.delete(existingTyping._id);
    }
  },
});

export const getTypingUsers = query({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const typingUsers = await ctx.db
      .query("typingIndicators")
      .filter((q) => q.eq(q.field("communityId"), args.communityId))
      .collect();

    // Nettoyer les indicateurs trop vieux (plus de 5 secondes)
    const now = Date.now();
    const activeTypers = typingUsers.filter((typer) => now - typer.lastTyping < 5000);
    
    // Supprimer les indicateurs expirés
    const expiredTypers = typingUsers.filter((typer) => now - typer.lastTyping >= 5000);
    await Promise.all(expiredTypers.map((typer) => ctx.db.delete(typer._id)));

    return activeTypers;
  },
});

export const send = mutation({
  args: {
    body: v.string(),
    image: v.optional(v.string()),
    communityId: v.id("communities"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.clerkId) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    // Vérifier si l'utilisateur est membre de la communauté
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
  args: { 
    communityId: v.id("communities"),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
      .order("desc")
      .take(100);

    const messagesWithAuthor = await Promise.all(
      messages.map(async (msg) => {
        const author = await ctx.db.get(msg.userId);
        let imageUrl = undefined;
        if (msg.image) {
          imageUrl = await ctx.storage.getUrl(msg.image) || undefined;
        }
        return {
          ...msg,
          image: imageUrl,
          author: author ? {
            username: author.username,
            avatarUrl: author.avatarUrl,
            _id: author._id,
            clerkId: author.clerkId
          } : null
        };
      })
    );

    return messagesWithAuthor.reverse();
  },
});