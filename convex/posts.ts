import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

export const createPost = mutation({
    args: {
        title: v.string(),
        content: v.string(),
        communityId: v.optional(v.id("communities")),
        image: v.optional(v.string()),
        clerkId: v.string(), // Ajouter ce champ pour recevoir l'ID Clerk
    },
    handler: async (ctx, args) => {
        // Vérifier que l'ID Clerk est fourni
        if (!args.clerkId) {
            throw new Error("Non authentifié - Veuillez vous connecter");
        }

        // Trouver l'utilisateur par son clerkId
        const user = await ctx.db.query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (!user) {
            throw new Error("Utilisateur non trouvé dans la base de données");
        }

        // Optionnel : vérifier si un post avec le même titre existe déjà
        const existingPost = await ctx.db.query("posts")
            .filter((q) => q.eq(q.field("title"), args.title))
            .first();

        if (existingPost) {
            throw new Error("Un post avec ce titre existe déjà");
        }

        // Créer le post
        const postId = await ctx.db.insert("posts", {
            title: args.title,
            content: args.content || "",
            communityId: args.communityId || undefined,
            image: args.image || undefined,
            authorId: user._id,
            createdAt: Date.now(),
        });

        return postId;
    },
});


export const getFeed = query({
    handler: async (ctx) => {
        const posts = await ctx.db.query("posts").order("desc").take(50);

        return await Promise.all(
            posts.map(async (post) => {
                const author = await ctx.db.get(post.authorId);
                const community = post.communityId ? await ctx.db.get(post.communityId) : null;
                
                let imageUrl = undefined;
                if (post.image) {
                    imageUrl = await ctx.storage.getUrl(post.image) || undefined;
                }

                let communityImageUrl = undefined;
                if (community && community.image) {
                   communityImageUrl = await ctx.storage.getUrl(community.image) || undefined;
                }

                return {
                    ...post,
                    image: imageUrl,
                    author: author ? {
                        username: author.username,
                        avatarUrl: author.avatarUrl,
                    } : null,
                    community: community ? {
                        name: community.name,
                        image: communityImageUrl,
                    } : null,
                };
            })
    );
    },
});

export const getPost = query({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        const post = await ctx.db.get(args.postId);
        if (!post) return null;

        const author = await ctx.db.get(post.authorId);
        const community = post.communityId ? await ctx.db.get(post.communityId) : null;

        let imageUrl = undefined;
        if (post.image) {
            imageUrl = await ctx.storage.getUrl(post.image) || undefined;
        }

        let communityImageUrl = undefined;
        if (community && community.image) {
            communityImageUrl = await ctx.storage.getUrl(community.image) || undefined;
        }

        // Récupérer le nombre de commentaires
        const comments = await ctx.db.query("comments")
            .withIndex("by_post", (q) => q.eq("postId", post._id))
            .collect();
        
        // Récupérer les votes (likes)
        const upvotes = await ctx.db.query("likes")
            .filter((q) => q.eq(q.field("targetId"), post._id))
            .filter((q) => q.eq(q.field("targetType"), "post"))
            .filter((q) => q.eq(q.field("type"), "like"))
            .collect();

        const downvotes = await ctx.db.query("likes")
            .filter((q) => q.eq(q.field("targetId"), post._id))
            .filter((q) => q.eq(q.field("targetType"), "post"))
            .filter((q) => q.eq(q.field("type"), "dislike"))
            .collect();

        // Déterminer le vote de l'utilisateur actuel
        const identity = await ctx.auth.getUserIdentity();
        let userVote = null;
        if (identity) {
            const user = await ctx.db.query("users")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
                .first();

            if (user) {
                const userLike = await ctx.db.query("likes")
                    .filter((q) => q.eq(q.field("targetId"), post._id))
                    .filter((q) => q.eq(q.field("targetType"), "post"))
                    .filter((q) => q.eq(q.field("userId"), user._id))
                    .first();
                
                if (userLike) {
                    userVote = userLike.type; // "like" ou "dislike"
                }
            }
        }

        return {
            ...post,
            image: imageUrl,
            author: author ? {
                username: author.username,
                avatarUrl: author.avatarUrl,
            } : null,
            community: community ? {
                name: community.name,
                image: communityImageUrl,
            } : null,
            commentCount: comments.length,
            upvotes: upvotes.length,
            downvotes: downvotes.length,
            userVote,
        };
    },
});

export const getCommunityPosts = query({
    args: { communityId: v.id("communities") },
    handler: async (ctx, args) => {
        const posts = await ctx.db.query("posts")
            .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
            .order("desc")
            .take(50);

        return await Promise.all(
            posts.map(async (post) => {
                const author = await ctx.db.get(post.authorId);
                const community = await ctx.db.get(args.communityId);
                
                let imageUrl = undefined;
                if (post.image) {
                    imageUrl = await ctx.storage.getUrl(post.image) || undefined;
                }

                let communityImageUrl = undefined;
                if (community && community.image) {
                   communityImageUrl = await ctx.storage.getUrl(community.image) || undefined;
                }

                return {
                    ...post,
                    image: imageUrl,
                    author: author ? {
                        username: author.username,
                        avatarUrl: author.avatarUrl,
                    } : null,
                    community: community ? {
                        name: community.name,
                        image: communityImageUrl,
                    } : null,
                };
            })
        );
    },
});