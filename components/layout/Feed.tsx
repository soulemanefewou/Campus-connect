"use client";

import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Camera, Clock, Filter, Flame, Plus, TrendingUp, Users } from "lucide-react";
import { Button } from "../ui/button";
import { PostSkeleton } from "../posts/PostSkeleton";
import { PostCard } from "../posts/PostCard";
import { CreatePost } from "../posts/CreatePost";

const Feed = () => {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [sortBy, setSortBy] = useState("hot");

  const posts = useQuery(api.posts.getFeed);
  const user = useUser();

  return (
    <>
      <div className="space-y-6">
        {/*Creation de post avec Skeleton*/}
        <div className="rounded-xl bg-white p-4 border border-gray-200">
          {!user ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="flex-1 h-12 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-orange-100 text-orange-600">
                  <Users className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>

              <Button
                variant="outline"
                className="flex-1 h-12 justify-start text-gray-500 hover:text-gray-700 border-gray-300 hover:border-orange-400 rounded-lg"
                onClick={() => setShowCreatePost(true)}
              >
                Créer un post...
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-gray-500"
                  onClick={() => setShowCreatePost(true)}
                >
                  <Camera className="h-5 w-5" />
                </Button>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 rounded-lg"
                  onClick={() => setShowCreatePost(true)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/*Filtres avec Skeleton*/}

        <div className="rounded-xl bg-white p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            {!posts ? (
              <>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-20" />
              </>
            ) : (
              <>
                <h3 className="font-semibold text-gray-900">Posts récents</h3>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtres
                </Button>
              </>
            )}
          </div>

          {!posts ? (
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant={sortBy === "hot" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("hot")}
                className={`gap-2 ${sortBy === "hot" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
              >
                <Flame className="h-4 w-4" />
                Tendance
              </Button>

              <Button
                variant={sortBy === "new" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("new")}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                Récents
              </Button>
              <Button
                variant={sortBy === "top" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("top")}
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Top
              </Button>
            </div>
          )}
        </div>
        {/* Posts avec Sheleton loaders*/ }
        <div className="space-y-4">
            {!posts ? (
                // Display multiple skeleton loaders
                Array.from({ length: 3 }).map((_, index) => (
                    <PostSkeleton key={index} />
                ))
            ) : posts.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-gray-200 text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 mb-4">
                        <Flame className="h-6 w-6 text-orange-600"/>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">C'est calme ici...</h3>
                    <p className="mt-1 text-gray-500">Soyez le premier à publier quelque chose !</p>
                    <Button
                        variant= "outline"
                        className="mt-4"
                        onClick={() => setShowCreatePost(true)}
                    >
                        Créer un post
                    </Button>
                </div>
            ) : (
                posts.map((post) => (
                    <PostCard
                        key={post._id}
                        id={post._id}
                        title={post.title}
                        content={post.content}
                        createdAt={post.createdAt}
                        image={post.image}
                        author={post.author}
                        community={post.community}
                        comments={post.commentCount}
                        upvotes={post.upvotes}
                        downvotes={post.downvotes}
                        userVote={post.userVote}
                    />

                ))
            )}
        </div>
         {/* Charger plus avec Skeleton */}
        {!posts ? (
          <div className="text-center">
            <Skeleton className="h-10 w-40 mx-auto rounded-lg" />
          </div>
        ) : posts.length > 0 && (
          <div className="text-center">
            <Button variant="outline" className="rounded-lg">
              Charger plus de posts
            </Button>
          </div>
        )}
      </div>

      {/* Modal création post */}
      {showCreatePost && (
        <CreatePost onClose={() => setShowCreatePost(false)} />
      )}

      
    </>
  );
};

export default Feed;
