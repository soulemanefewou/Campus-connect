'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { PostCard } from '@/components/posts/PostCard';
import { PostSkeleton } from '@/components/posts/PostSkeleton';
import { Id } from '@/convex/_generated/dataModel';
import { useParams } from 'next/navigation';
import { CommentForm } from '@/components/comments/CommentForm';
import { CommentList } from '@/components/comments/CommentList';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function CommentsPage() {
    // Unwrapping params using useParams hook to avoid "Promise" error in Client Component
    const params = useParams();
    const router = useRouter();
    const postId = params.id as Id<"posts">;

    const post = useQuery(api.posts.getPost, { postId });

    if (!post) {
        return (
            <div className="max-w-2xl mx-auto py-8 px-4">
                <PostSkeleton />
            </div>
        );
    }

    if (post === null) {
        return (
            <div className="max-w-2xl mx-auto py-8 px-4 text-center">
                <h1 className="text-2xl font-bold text-gray-800">Post introuvable</h1>
                <p className="text-gray-600">Ce post n'existe pas ou a été supprimé.</p>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
            <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-gray-500 hover:text-gray-900 -ml-2"
                onClick={() => router.back()}
            >
                <ArrowLeft className="h-4 w-4" />
                Retour
            </Button>
            <PostCard
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

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <CommentForm postId={postId} />
                <CommentList postId={postId} />
            </div>
        </div>
    );
}