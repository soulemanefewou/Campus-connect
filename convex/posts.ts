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
    },
    handler: async (ctx, args) => {
        // Récupérer l'identité de l'utilisateur authentifié
        const identity = await ctx.auth.getUserIdentity();
        
        if (!identity) {
            throw new Error("Non authentifié - Veuillez vous connecter");
        }

        // Vérifier que l'utilisateur existe dans la base de données
        const user = await ctx.db.query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) {
            // Si l'utilisateur n'existe pas dans votre base de données,
            // vous pouvez le créer ici ou lancer une erreur
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