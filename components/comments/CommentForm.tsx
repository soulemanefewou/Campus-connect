'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

interface CommentFormProps {
    postId: Id<"posts">;
}

export function CommentForm({ postId }: CommentFormProps) {
    const { user, isLoaded } = useUser(); // Ajouter isLoaded
    const createComment = useMutation(api.comments.createComment);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;

        // Vérifier que l'utilisateur est chargé et connecté
        if (!isLoaded) {
            toast.error("Chargement de l'authentification...");
            return;
        }
        
        if (!user) {
            toast.error("Veuillez vous connecter pour commenter");
            return;
        }

        setIsSubmitting(true);
        try {
            await createComment({ 
                postId, 
                content: newComment,
                clerkId: user.id // Passer l'ID Clerk ici
            });
            setNewComment('');
            toast.success('Commentaire ajouté');
        } catch (error) {
            toast.error("Erreur lors de l'ajout du commentaire");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex gap-4 mb-8">
            <Avatar className="h-10 w-10">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback>{user?.firstName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 gap-2 flex flex-col">
                <Textarea
                    placeholder="Ajouter un commentaire..."
                    className="min-h-[100px] resize-none focus-visible:ring-orange-500"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <div className="flex justify-end">
                    <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || isSubmitting || !user}
                    >
                        <Send className="h-4 w-4" />
                        Commenter
                    </Button>
                </div>
            </div>
        </div>
    );
}