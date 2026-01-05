import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),        // ID Clerk (clé externe)
    username: v.string(),       // pseudo visible
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_username", ["username"]),
    typingIndicators: defineTable({
      typingId: v.string(), // communautéId-utilisateurId
      userId: v.id("users"),
      communityId: v.id("communities"),
      username: v.string(),
      lastTyping: v.number(),
    })
      .index("by_typingId", ["typingId"])
      .index("by_community", ["communityId"]),
  

  communities: defineTable({
    name: v.string(),              
    slug: v.string(),              
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    communityType: v.union(
      v.literal("public"),
      v.literal("private")
    ),
    clerkId: v.optional(v.string()), // Rendu optionnel pour les anciens documents
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_creator", ["createdBy"]),

  posts: defineTable({
    title: v.string(),
    content: v.string(),
    authorId: v.id("users"),
    communityId: v.optional(v.id("communities")),
    image: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_community", ["communityId"])
    .index("by_author", ["authorId"])
    .index("by_createdAt", ["createdAt"]),

  comments: defineTable({
    content: v.string(),
    postId: v.id("posts"),
    authorId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_post", ["postId"])
    .index("by_author", ["authorId"]),

  follows: defineTable({
    followerId: v.id("users"),
    targetType: v.union(
      v.literal("community"),
      v.literal("user")
    ),
    targetId: v.union(
      v.id("communities"),
      v.id("users")
    ),
    createdAt: v.number(),
  })
    .index("by_follower", ["followerId"])
    .index("by_target", ["targetType", "targetId"]),

  likes: defineTable({
    userId: v.id("users"),
    targetType: v.union(
      v.literal("post"),
      v.literal("comment")
    ),
    targetId: v.union(
      v.id("posts"),
      v.id("comments")
    ),
    type: v.optional(v.union(v.literal("like"), v.literal("dislike"))),
    createdAt: v.number(),
  })
    .index("by_target", ["targetType", "targetId"])
    .index("by_user", ["userId"]),

  messages: defineTable({
    body: v.string(),
    image: v.optional(v.string()), // storageId
    communityId: v.id("communities"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_community", ["communityId"])
    .index("by_createdAt", ["createdAt"]),

})