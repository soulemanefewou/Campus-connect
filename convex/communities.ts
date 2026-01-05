import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getCommunities = query({
    handler: async (ctx) => {
        return await ctx.db.query("communities").order("desc").take(100);
    },
});

export const getUserCommunities = query({
    args: {
        clerkId: v.optional(v.string()), // Ajouter clerkId comme argument optionnel
    },
    handler: async (ctx, args) => {
        // Utiliser clerkId passé en argument au lieu de ctx.auth.getUserIdentity()
        if (!args.clerkId) return [];

        const user = await ctx.db.query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (!user) return [];

        const follows = await ctx.db.query("follows")
            .withIndex("by_follower", (q) => q.eq("followerId", user._id))
            .filter((q) => q.eq(q.field("targetType"), "community"))
            .collect();

        const communities = await Promise.all(
            follows.map(async (follow) => {
                if (follow.targetType === "community") {
                    const community = await ctx.db.get(follow.targetId as Id<"communities">);
                    if (!community) return null;
                    
                    // Récupérer l'URL de l'image si elle existe
                    let imageUrl = undefined;
                    if (community.image) {
                        imageUrl = await ctx.storage.getUrl(community.image);
                    }
                    
                    return { 
                        ...community, 
                        image: imageUrl || undefined 
                    };
                }
                return null;
            })
        );

        return communities.filter((c): c is NonNullable<typeof c> => c !== null);
    },
});

export const getCreatedCommunities = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db.query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) return [];

        const communities = await ctx.db.query("communities")
            .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
            .collect();

        const communitiesWithUrls = await Promise.all(
            communities.map(async (community) => {
                if (community.image) {
                    const imageUrl = await ctx.storage.getUrl(community.image);
                    return { ...community, image: imageUrl || undefined };
                }
                return community;
            })
        );

        return communitiesWithUrls;
    },
});

export const createCommunity = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        description: v.string(),
        image: v.optional(v.string()),
        communityType: v.union(v.literal("public"), v.literal("private")),
        clerkId: v.string(), // Ajouter ce champ pour recevoir l'ID Clerk
    },
    handler: async (ctx, args) => {
        // Vérifier que l'ID Clerk est fourni
        if (!args.clerkId) {
            throw new Error("Unauthenticated");
        }

        // Trouver l'utilisateur par son clerkId
        const user = await ctx.db.query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        const existingCommunity = await ctx.db.query("communities")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();

        if (existingCommunity) throw new Error("Slug already taken");

        const communityId = await ctx.db.insert("communities", {
            name: args.name,
            slug: args.slug,
            description: args.description,
            image: args.image,
            communityType: args.communityType,
            createdBy: user._id,
            clerkId: args.clerkId,
            createdAt: Date.now(),
        });

        // Auto-follow logic could be added here later
        
        return communityId;
    },
});

export const getCommunityRecommendations = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        const allCommunities = await ctx.db.query("communities").order("desc").take(50);
        
        let communities = allCommunities;

        if (identity) {
             const user = await ctx.db.query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();

            if (user) {
                const follows = await ctx.db.query("follows")
                    .withIndex("by_follower", (q) => q.eq("followerId", user._id))
                    .filter((q) => q.eq(q.field("targetType"), "community"))
                    .collect();

                const joinedCommunityIds = new Set(follows.map(f => f.targetId));
                communities = allCommunities.filter(c => !joinedCommunityIds.has(c._id));
            }
        }

        const communitiesWithUrls = await Promise.all(
            communities.slice(0, 10).map(async (community) => {
                 if (community.image) {
                    const imageUrl = await ctx.storage.getUrl(community.image);
                    return { ...community, image: imageUrl || undefined };
                }
                return community;
            })
        );
        
        return communitiesWithUrls;
    },
});

export const joinCommunity = mutation({
    args: { 
        communityId: v.id("communities"),
        clerkId: v.string() // Ajouter clerkId
    },
    handler: async (ctx, args) => {
        // Vérifier que l'ID Clerk est fourni
        if (!args.clerkId) {
            throw new Error("Unauthenticated");
        }

        // Trouver l'utilisateur par son clerkId
        const user = await ctx.db.query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (!user) throw new Error("User not found");

        const existingFollow = await ctx.db.query("follows")
            .withIndex("by_follower", (q) => q.eq("followerId", user._id))
            .filter((q) => q.eq(q.field("targetType"), "community"))
            .filter((q) => q.eq(q.field("targetId"), args.communityId))
            .first();

        if (existingFollow) return; // Already joined

        await ctx.db.insert("follows", {
            followerId: user._id,
            targetType: "community",
            targetId: args.communityId,
            createdAt: Date.now(),
        });
    },
});

export const leaveCommunity = mutation({
    args: { 
        communityId: v.id("communities"),
        clerkId: v.string() // Ajouter clerkId
    },
    handler: async (ctx, args) => {
        // Vérifier que l'ID Clerk est fourni
        if (!args.clerkId) {
            throw new Error("Unauthenticated");
        }

        // Trouver l'utilisateur par son clerkId
        const user = await ctx.db.query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (!user) throw new Error("User not found");

        const existingFollow = await ctx.db.query("follows")
            .withIndex("by_follower", (q) => q.eq("followerId", user._id))
            .filter((q) => q.eq(q.field("targetType"), "community"))
            .filter((q) => q.eq(q.field("targetId"), args.communityId))
            .first();

        if (existingFollow) {
             await ctx.db.delete(existingFollow._id);
        }
    },
});

export const getCommunity = query({
    args: { 
        communityId: v.id("communities"),
        clerkId: v.optional(v.string()), // Ajouter clerkId optionnel
    },
    handler: async (ctx, args) => {
        const community = await ctx.db.get(args.communityId);
        if (!community) return null;

        let isJoined = false;
        
        // Utiliser clerkId passé en argument
        if (args.clerkId) {
            const user = await ctx.db.query("users")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId as string))
                .first();

            if (user) {
                const follow = await ctx.db.query("follows")
                    .withIndex("by_follower", (q) => q.eq("followerId", user._id))
                    .filter((q) => q.eq(q.field("targetType"), "community"))
                    .filter((q) => q.eq(q.field("targetId"), community._id))
                    .first();
                isJoined = !!follow;
            }
        }

        const memberCount = await ctx.db.query("follows")
            .withIndex("by_target", (q) => q.eq("targetType", "community").eq("targetId", community._id))
            .collect();
            
        let imageUrl = undefined;
        if (community.image) {
            imageUrl = await ctx.storage.getUrl(community.image) || undefined;
        }

        return {
            ...community,
            image: imageUrl,
            memberCount: memberCount.length,
            isJoined,
        };
    },
});

export const getAllCommunities = query({
    args: {
        clerkId: v.optional(v.string()), // Rendre optionnel pour les utilisateurs non connectés
    },
    handler: async (ctx, args) => {
        const communities = await ctx.db.query("communities").order("desc").take(50);
        
        let joinedCommunityIds = new Set<Id<"communities">>();

        // Utiliser clerkId passé en argument au lieu de ctx.auth.getUserIdentity()
        if (args.clerkId) {
            const user = await ctx.db.query("users")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId as string))
                .first();

            if (user) {
                const follows = await ctx.db.query("follows")
                    .withIndex("by_follower", (q) => q.eq("followerId", user._id))
                    .filter((q) => q.eq(q.field("targetType"), "community"))
                    .collect();

                follows.forEach(f => {
                    if (f.targetType === "community") {
                        joinedCommunityIds.add(f.targetId as Id<"communities">);
                    }
                });
            }
        }

        const communitiesWithData = await Promise.all(
            communities.map(async (community) => {
                 let imageUrl = undefined;
                 if (community.image) {
                    imageUrl = await ctx.storage.getUrl(community.image) || undefined;
                }
                
                const memberCount = await ctx.db.query("follows")
                    .withIndex("by_target", (q) => q.eq("targetType", "community").eq("targetId", community._id))
                    .collect();

                return { 
                    ...community, 
                    image: imageUrl,
                    memberCount: memberCount.length,
                    isJoined: joinedCommunityIds.has(community._id)
                };
            })
        );
        
        return communitiesWithData;
    },
});
