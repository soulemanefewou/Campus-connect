'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Image as ImageIcon, Loader2, Smile, Paperclip, Lock, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

interface ChatInterfaceProps {
    communityId: Id<"communities">;
}

export function ChatInterface({ communityId }: ChatInterfaceProps) {
    const { user, isLoaded } = useUser();
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
    
    // Vérifier si l'utilisateur est dans la communauté
    const community = useQuery(api.communities.getCommunity, { 
        communityId,
        clerkId: user?.id || undefined 
    });
    
    // Récupérer les messages
    const messages = useQuery(api.messages.list, { 
        communityId,
        clerkId: user?.id || undefined 
    });
    
    // Récupérer les utilisateurs en train d'écrire
    const typingUsers = useQuery(api.messages.getTypingUsers, { communityId });
    
    // Mutations
    const sendMessage = useMutation(api.messages.send);
    const setTyping = useMutation(api.messages.typing);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fonction pour indiquer que l'utilisateur est en train d'écrire
    const indicateTyping = useCallback(async (isTyping: boolean) => {
        if (!user || !isLoaded || !community?.isJoined) return;
        
        try {
            await setTyping({
                communityId,
                clerkId: user.id,
                isTyping,
            });
        } catch (error) {
            console.error("Erreur lors de l'indication d'écriture:", error);
        }
    }, [user, isLoaded, community, communityId, setTyping]);

    // Gérer le changement de texte avec détection d'écriture
    const handleTextChange = (text: string) => {
        setNewMessage(text);
        
        // Indiquer que l'utilisateur est en train d'écrire
        if (text.length > 0) {
            indicateTyping(true);
            
            // Clear le timeout précédent
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }
            
            // Définir un nouveau timeout pour indiquer que l'utilisateur a arrêté d'écrire
            const timeout = setTimeout(() => {
                indicateTyping(false);
            }, 2000);
            
            setTypingTimeout(timeout);
        } else {
            indicateTyping(false);
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }
        }
    };

    // Nettoyer l'indicateur d'écriture quand le composant est démonté
    useEffect(() => {
        return () => {
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }
            indicateTyping(false);
        };
    }, [indicateTyping, typingTimeout]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, typingUsers]);

    // Polling pour les indicateurs d'écriture
    useEffect(() => {
        if (community?.isJoined) {
            const interval = setInterval(() => {
                // Le query sera automatiquement rafraîchi
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [community?.isJoined]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;

        if (!isLoaded) {
            toast.error("Chargement de l'authentification...");
            return;
        }
        
        if (!user) {
            toast.error("Veuillez vous connecter pour envoyer un message");
            return;
        }

        if (!community?.isJoined) {
            toast.error("Vous devez rejoindre la communauté pour envoyer des messages");
            return;
        }

        setIsSending(true);
        try {
            // Indiquer que l'utilisateur a arrêté d'écrire
            await indicateTyping(false);
            
            await sendMessage({
                communityId,
                body: newMessage,
                clerkId: user.id
            });
            setNewMessage('');
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'envoi du message";
            toast.error(errorMessage);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Filtrer l'utilisateur actuel des personnes en train d'écrire
    const otherTypingUsers = typingUsers?.filter(typer => 
        user?.id !== typer.userId
    ) || [];

    // Formater la liste des personnes en train d'écrire
    const getTypingMessage = () => {
        if (otherTypingUsers.length === 0) return null;
        
        const usernames = otherTypingUsers.map(t => t.username);
        
        if (usernames.length === 1) {
            return `${usernames[0]} est en train d'écrire...`;
        } else if (usernames.length === 2) {
            return `${usernames[0]} et ${usernames[1]} sont en train d'écrire...`;
        } else {
            return `${usernames[0]}, ${usernames[1]} et ${usernames.length - 2} autre(s) sont en train d'écrire...`;
        }
    };

    const typingMessage = getTypingMessage();

    if (messages === undefined) {
        return (
            <div className="flex flex-col h-[600px] bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
                    <h3 className="font-bold text-gray-900">Discussions en direct</h3>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Chargement des messages...</p>
                    </div>
                </div>
            </div>
        );
    }

    const isUserMember = community?.isJoined || false;

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Header du Chat */}
            <div className={`p-4 border-b ${isUserMember ? 'bg-gradient-to-r from-orange-50 to-red-50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {!isUserMember && (
                            <div className="p-1.5 bg-gray-200 rounded-lg">
                                <Lock className="h-4 w-4 text-gray-600" />
                            </div>
                        )}
                        <div>
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                {isUserMember ? (
                                    <>
                                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                        Discussions en direct
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4 text-gray-600" />
                                        Chat verrouillé
                                    </>
                                )}
                            </h3>
                            <div className="flex items-center gap-2 text-sm">
                                <p className="text-gray-600">
                                    {messages.length > 0 ? `${messages.length} message${messages.length > 1 ? 's' : ''}` : "Aucun message"}
                                </p>
                                {community?.memberCount && (
                                    <>
                                        <span className="text-gray-300">•</span>
                                        <span className="flex items-center gap-1 text-gray-600">
                                            <Users className="h-3 w-3" />
                                            {community.memberCount}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    {!isUserMember && (
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="text-orange-600 border-orange-300 hover:bg-orange-50 font-medium"
                            onClick={() => toast.info(`Rejoignez la communauté pour participer !`)}
                        >
                            <Lock className="h-3 w-3 mr-1" />
                            Rejoindre pour discuter
                        </Button>
                    )}
                </div>
            </div>

            {/* Zone de messages */}
            <div 
                className={`flex-1 overflow-y-auto p-4 space-y-4 relative ${!isUserMember ? 'opacity-60' : ''}`}
                ref={scrollRef}
            >
                {!isUserMember && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 text-center">
                        <div className="mb-4 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 p-4">
                            <Lock className="h-12 w-12 text-gray-600" />
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-2">Accès restreint</h4>
                        <p className="text-gray-600 max-w-md mb-6">
                            Vous devez être membre de cette communauté pour voir et participer aux discussions.
                            Rejoignez-la pour échanger avec les autres membres !
                        </p>
                        <div className="space-y-2">
                            <Button 
                                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                                onClick={() => toast.info(`Rejoindre ${community?.name || 'cette communauté'}`)}
                            >
                                <Users className="h-4 w-4 mr-2" />
                                Rejoindre la communauté
                            </Button>
                            <p className="text-xs text-gray-500">
                                {community?.memberCount || 0} membres actifs
                            </p>
                        </div>
                    </div>
                )}

                {messages.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center h-full text-center p-8 ${!isUserMember ? 'hidden' : ''}`}>
                        <div className="mb-4 rounded-full bg-gradient-to-r from-orange-100 to-red-100 p-4">
                            <MessageCircleDashed className="h-12 w-12 text-orange-500" />
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-2">Aucun message pour le moment</h4>
                        <p className="text-gray-500 max-w-md">
                            Soyez le premier à démarrer la conversation dans cette communauté !
                        </p>
                    </div>
                ) : (
                    <div className={!isUserMember ? 'blur-sm pointer-events-none' : ''}>
                        {messages.map((msg) => {
                            const isMyMessage = user?.id === msg.author?.clerkId;

                            return (
                                <div 
                                    key={msg._id} 
                                    className={`flex gap-3 ${isMyMessage ? 'flex-row-reverse' : ''} animate-in fade-in duration-300`}
                                >
                                    {!isMyMessage && (
                                        <Avatar className="h-8 w-8 shrink-0 border-2 border-white shadow-sm">
                                            <AvatarImage src={msg.author?.avatarUrl} />
                                            <AvatarFallback className="bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 text-xs">
                                                {msg.author?.username?.[0]?.toUpperCase() || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={`max-w-[75%] space-y-1 ${isMyMessage ? 'text-right' : ''}`}>
                                        <div className={`flex items-baseline gap-2 ${isMyMessage ? 'flex-row-reverse' : ''}`}>
                                            <span className="text-xs font-semibold text-gray-900">
                                                {isMyMessage ? 'Vous' : msg.author?.username || 'Anonyme'}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {formatDistanceToNow(msg.createdAt, { addSuffix: true, locale: fr })}
                                            </span>
                                        </div>
                                        <div className={`p-3 rounded-2xl text-sm shadow-sm ${isMyMessage
                                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-tr-none'
                                                : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                            }`}>
                                            <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                                            {msg.image && (
                                                <div className="mt-2 rounded-lg overflow-hidden border border-white/20">
                                                    <img 
                                                        src={msg.image} 
                                                        alt="attachment" 
                                                        className="max-w-full h-auto object-cover max-h-48" 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {isMyMessage && (
                                        <Avatar className="h-8 w-8 shrink-0 border-2 border-white shadow-sm">
                                            <AvatarImage src={user?.imageUrl || ''} />
                                            <AvatarFallback className="bg-gradient-to-br from-orange-200 to-red-200 text-orange-700">
                                                {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            );
                        })}

                        {/* Indicateur "en train d'écrire" */}
                        {typingMessage && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-4 animate-in fade-in">
                                <div className="flex space-x-1">
                                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="italic">{typingMessage}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Zone de saisie */}
            <div className={`p-4 border-t border-gray-100 ${!isUserMember ? 'bg-gray-50' : 'bg-white'}`}>
                {!isLoaded ? (
                    <div className="p-3 bg-gray-100 rounded-lg text-center">
                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                        <span className="text-sm text-gray-600">Vérification de l'authentification...</span>
                    </div>
                ) : !user ? (
                    <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 text-center">
                        <p className="text-sm text-gray-700 mb-2">
                            Connectez-vous pour participer aux discussions
                        </p>
                        <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                            onClick={() => toast.info("Fonctionnalité de connexion à implémenter")}
                        >
                            Se connecter
                        </Button>
                    </div>
                ) : !isUserMember ? (
                    <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">
                                    Rejoignez la communauté pour discuter
                                </span>
                            </div>
                            <Button 
                                size="sm" 
                                variant="outline"
                                className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                onClick={() => toast.info(`Rejoindre ${community?.name || 'cette communauté'}`)}
                            >
                                Rejoindre
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {community?.memberCount || 0} membres attendent vos messages
                        </p>
                    </div>
                ) : (
                    <>
                        <form
                            onSubmit={handleSendMessage}
                            className="flex items-center gap-2"
                        >
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                                    onClick={() => toast.info("Émojis bientôt disponibles !")}
                                >
                                    <Smile className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                                    onClick={() => toast.info("L'envoi de fichiers arrive bientôt !")}
                                >
                                    <Paperclip className="h-4 w-4" />
                                </Button>
                            </div>

                            <Input
                                value={newMessage}
                                onChange={(e) => handleTextChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Écrivez votre message..."
                                className="flex-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all rounded-full"
                                disabled={isSending}
                            />

                            <Button
                                type="submit"
                                disabled={!newMessage.trim() || isSending}
                                className="h-9 w-9 p-0 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </form>
                        
                        <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-gray-400">
                                {newMessage.length === 0 ? "Tapez un message pour commencer" : ""}
                            </p>
                            {newMessage.length > 0 && (
                                <p className="text-xs text-gray-500">
                                    {newMessage.length}/500 caractères
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function MessageCircleDashed({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M13.5 3.1c-.5 0-1-.1-1.5-.1s-1 .1-1.5.1" />
            <path d="M19.3 6.8a10.45 10.45 0 0 0-2.1-2.1" />
            <path d="M21.5 13.5c.1-.5.1-1 .1-1.5s-0.1-1-.1-1.5" />
            <path d="M17.2 19.3a10.45 10.45 0 0 0 2.1-2.1" />
            <path d="M10.5 21.5c.5.1 1 .1 1.5.1s1-.1 1.5-.1" />
            <path d="M4.7 17.2a10.45 10.45 0 0 0 2.1 2.1" />
            <path d="M2.5 10.5c-.1.5-.1 1-.1 1.5s0.1 1 .1 1.5" />
            <path d="M6.8 4.7a10.45 10.45 0 0 0-2.1 2.1" />
        </svg>
    )
}