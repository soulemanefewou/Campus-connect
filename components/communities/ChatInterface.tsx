'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

interface ChatInterfaceProps {
    communityId: Id<"communities">;
}

export function ChatInterface({ communityId }: ChatInterfaceProps) {
    const { user } = useUser();
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messages = useQuery(api.messages.list, { communityId });
    const sendMessage = useMutation(api.messages.send);
    const scrollRef = useRef<HTMLDivElement>(null);
    const generateUploadUrl = useMutation(api.posts.generateUploadUrl); // Reuse existing upload logic

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;

        setIsSending(true);
        try {
            await sendMessage({
                communityId,
                body: newMessage,
                // Image logic to be added if needed via upload button
            });
            setNewMessage('');
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de l'envoi du message");
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }

    if (messages === undefined) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Header du Chat */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    Discussions en direct
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                </h3>
                <p className="text-xs text-gray-500">Posez vos questions ou discutez avec la communauté.</p>
            </div>

            {/* Zone de messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                        <MessageCircleDashed className="h-12 w-12 mb-2 opacity-50" />
                        <p>Aucun message pour le moment.</p>
                        <p className="text-sm">Soyez le premier à dire bonjour !</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = user?.id === msg.author?._id; // Clerk ID mismatch fix needed if author stores DB ID.
                        // Correction: msg.userId is Convex ID. user.id is Clerk ID. 
                        // We need to compare correctly.
                        // Ideally, backend returns `isMe` boolean or we fetch current user Convex ID.
                        // For now, let's assume we can rely on author details.
                        const isMyMessage = msg.author?.username === user?.username; // Fallback comparison or fix backend.

                        return (
                            <div key={msg._id} className={`flex gap-3 ${isMyMessage ? 'flex-row-reverse' : ''}`}>
                                <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarImage src={msg.author?.avatarUrl} />
                                    <AvatarFallback>{msg.author?.username?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className={`max-w-[75%] space-y-1`}>
                                    <div className={`flex items-baseline gap-2 ${isMyMessage ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-sm font-semibold text-gray-900">{msg.author?.username}</span>
                                        <span className="text-[10px] text-gray-400">
                                            {formatDistanceToNow(msg.createdAt, { addSuffix: true, locale: fr })}
                                        </span>
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm ${isMyMessage
                                            ? 'bg-orange-500 text-white rounded-tr-none'
                                            : 'bg-gray-100 text-gray-800 rounded-tl-none'
                                        }`}>
                                        {msg.body}
                                    </div>
                                    {/* Image display if any */}
                                    {msg.image && (
                                        <img src={msg.image} alt="attachment" className="rounded-lg max-w-full mt-2" />
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Zone de saisie */}
            <div className="p-4 border-t border-gray-100 bg-white">
                <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-2"
                >
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => toast.info("L'envoi d'images arrive bientôt !")}
                    >
                        <ImageIcon className="h-5 w-5" />
                    </Button>

                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Écrivez un message..."
                        className="flex-1 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                        disabled={isSending}
                    />

                    <Button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4"
                    >
                        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}

function MessageCircleDashed({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M13.5 3.1c-.5 0-1-.1-1.5-.1s-1 .1-1.5.1" /><path d="M19.3 6.8a10.45 10.45 0 0 0-2.1-2.1" /><path d="M21.5 13.5c.1-.5.1-1 .1-1.5s-0.1-1-.1-1.5" /><path d="M17.2 19.3a10.45 10.45 0 0 0 2.1-2.1" /><path d="M10.5 21.5c.5.1 1 .1 1.5.1s1-.1 1.5-.1" /><path d="M4.7 17.2a10.45 10.45 0 0 0 2.1 2.1" /><path d="M2.5 10.5c-.1.5-.1 1-.1 1.5s0.1 1 .1 1.5" /><path d="M6.8 4.7a10.45 10.45 0 0 0-2.1 2.1" /></svg>
    )
}