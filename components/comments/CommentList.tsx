'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ThumbsUp, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';

interface CommentListProps {
    postId: Id<"posts">;
}

interface Comment {
    _id: Id<"comments">;
    _creationTime: number;
    content: string;
    postId: Id<"posts">;
    authorId: Id<"users">;
    createdAt: number;
    updatedAt?: number;
    author: {
        username: string;
        avatarUrl?: string;
    } | null;
    likes: number;
    userLiked: boolean;
}

export function CommentList({ postId }: CommentListProps) {
    const comments = useQuery(api.comments.getComments, { postId });
    const toggleLike = useMutation(api.comments.toggleLike);
    const { user, isLoaded } = useUser();
    const handleLikeComment = async (commentId: Id<"comments">) => {
        if (!isLoaded) {
            toast.error("Chargement de l'authentification...");
            return;
        }
        if (!user) {
            toast.error("Veuillez vous connecter pour liker un commentaire");
            return;
        }
        try {
            await toggleLike({ commentId, clerkId: user?.id as string });
        } catch (error) {
            toast.error("Erreur action impossible");
        }
    };

    if (!comments) {
        return <div className="text-center py-4">Chargement des commentaires...</div>;
    }

    if (comments.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 italic">
                Aucun commentaire pour le moment. Soyez le premier !
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                Commentaires
                <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {comments.length}
                </span>
            </h3>

            {comments.map((comment: any) => ( // Using any here temporarily if types are not synced, but logic is sound
                <div key={comment._id} className="flex gap-3 group">
                    <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={comment.author?.avatarUrl} />
                        <AvatarFallback>{comment.author?.username?.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3 relative">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm text-gray-900">
                                    {comment.author?.username || 'Anonyme'}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: fr })}
                                </span>
                            </div>
                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
                        </div>

                        <div className="flex items-center gap-4 mt-1 pl-1">
                            <button
                                className={`text-xs font-medium flex items-center gap-1 hover:text-orange-600 transition-colors ${comment.userLiked ? 'text-orange-600' : 'text-gray-500'}`}
                                onClick={() => handleLikeComment(comment._id)}
                            >
                                {comment.userLiked ? (
                                    <Heart className="h-3 w-3 fill-current" />
                                ) : (
                                    <ThumbsUp className="h-3 w-3" />
                                )}
                                {comment.likes > 0 && <span>{comment.likes}</span>}
                                J'aime
                            </button>
                            <button className="text-xs font-medium text-gray-500 hover:text-orange-600 transition-colors">
                                Répondre
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}