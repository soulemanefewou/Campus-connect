'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Home,
    Flame,
    TrendingUp,
    Search,
    PlusCircle,
    ChevronRight,
    Code,
    Building,
    Users2,
    Music,
    BookMarked,
    Coffee,
    GraduationCap,
    Mic2,
    Gamepad2,
    Trophy,
    Compass,
    History,
    ThumbsUp,
    Clock,
    Settings,
    HelpCircle,
    Flag,
    Globe,
    Sparkles,
    Bell,
    User
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useStore } from '@/store/useStore';
import { CreateCommunity } from '../communities/CreateCommunity';
import { SignedOut, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { mockCommunities } from './SidebarData';

export function SidebarContent() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'subscribed' | 'popular' | 'all'>('subscribed');
    const { activeCommunity, setActiveCommunity } = useStore();
    const { user } = useUser();

    const filteredCommunities = mockCommunities.filter(community =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const subscribedCommunities = filteredCommunities.filter(c => c.subscribed);
    const popularCommunities = filteredCommunities.filter(c => c.trending);

    const getDisplayedCommunities = () => {
        switch (activeTab) {
            case 'subscribed': return subscribedCommunities;
            case 'popular': return popularCommunities;
            case 'all': return filteredCommunities;
            default: return subscribedCommunities;
        }
    };

    const displayedCommunities = getDisplayedCommunities();

    return (
        <>
            <div className="h-full flex flex-col bg-white">
                {/* En-tête avec recherche */}
                <div className="p-4 border-b sticky top-0 bg-white z-10">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            type="search"
                            placeholder="Rechercher une communauté..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 rounded-full border-gray-300 focus-visible:ring-orange-500 h-9"
                        />
                    </div>

                    {/* Bouton création communauté */}
                    <Button
                        className="w-full gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-sm h-9"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <PlusCircle className="h-4 w-4" />
                        <span className="font-medium text-sm">Créer une communauté</span>
                    </Button>
                </div>

                {/* Contenu principal scrollable */}
                <div className="flex-1 overflow-y-auto">
                    <div className="space-y-1 py-2 px-2">
                        {/* Navigation principale */}
                        <div className="mb-4">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                                Navigation
                            </div>
                            <nav className="space-y-1">
                                {[
                                    { id: 'home', label: 'Accueil', icon: Home, badge: null },
                                    { id: 'popular', label: 'Populaire', icon: Flame, badge: '🔥' },
                                    { id: 'trending', label: 'Tendances', icon: TrendingUp, badge: '↑' },
                                    { id: 'discover', label: 'Découvrir', icon: Compass, badge: null },
                                    { id: 'history', label: 'Historique', icon: History, badge: null },
                                    { id: 'liked', label: 'Posts aimés', icon: ThumbsUp, badge: null },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveCommunity(item.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                                            activeCommunity === item.id
                                                ? "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 font-medium"
                                                : "hover:bg-gray-100 text-gray-700"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "h-5 w-5",
                                            activeCommunity === item.id ? "text-orange-600" : "text-gray-500"
                                        )} />
                                        <span className="flex-1 text-left text-sm">{item.label}</span>
                                        {item.badge && (
                                            <span className="text-xs font-medium">{item.badge}</span>
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Séparateur */}
                        <div className="px-4 py-2">
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                        </div>

                        {/* Section utilisateur connecté */}
                        {user && (
                            <div className="mb-4">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                                    Mon profil
                                </div>
                                <div className="space-y-1">
                                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors">
                                        <User className="h-5 w-5 text-gray-500" />
                                        <span className="flex-1 text-left text-sm">Mon profil</span>
                                    </button>
                                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors">
                                        <Bell className="h-5 w-5 text-gray-500" />
                                        <span className="flex-1 text-left text-sm">Notifications</span>
                                        <span className="rounded-full bg-orange-500 text-white text-xs h-5 w-5 flex items-center justify-center">
                                            3
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Section non connecté */}
                        <SignedOut>
                            <div className="mb-4">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                                    Connexion
                                </div>
                                <div className="space-y-2 px-2">
                                    <Link href="/sign-in" className="block">
                                        <Button variant="outline" className="w-full justify-start gap-3 border-orange-200 text-orange-700 hover:bg-orange-50 h-9">
                                            Se connecter
                                        </Button>
                                    </Link>
                                    <Link href="/sign-up" className="block">
                                        <Button className="w-full justify-start gap-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 h-9">
                                            S'inscrire
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </SignedOut>

                        {/* Tabs pour les communautés */}
                        <div className="mb-4">
                            <div className="flex border-b border-gray-200 mb-3">
                                {[
                                    { id: 'subscribed', label: 'Abonnements', count: subscribedCommunities.length },
                                    { id: 'popular', label: 'Populaire', count: popularCommunities.length },
                                    { id: 'all', label: 'Toutes', count: filteredCommunities.length },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "flex-1 py-2 text-sm font-medium transition-colors relative",
                                            activeTab === tab.id
                                                ? "text-orange-600"
                                                : "text-gray-600 hover:text-gray-900"
                                        )}
                                    >
                                        {tab.label}
                                        <span className="ml-1 text-xs text-gray-500">({tab.count})</span>
                                        {activeTab === tab.id && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Liste des communautés */}
                            <div className="space-y-1">
                                {displayedCommunities.map((community) => (
                                    <button
                                        key={community.id}
                                        onClick={() => setActiveCommunity(community.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                                            activeCommunity === community.id
                                                ? "bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200"
                                                : "hover:bg-gray-100"
                                        )}
                                    >
                                        <div className="relative">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center",
                                                community.color
                                            )}>
                                                <community.icon className="h-4 w-4 text-white" />
                                            </div>
                                            {community.subscribed && (
                                                <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                                            )}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900 group-hover:text-orange-600">
                                                    r/{community.name}
                                                </span>
                                                {community.trending && (
                                                    <Sparkles className="h-3 w-3 text-orange-500" />
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {community.members.toLocaleString('fr-FR')} membres
                                            </div>
                                        </div>
                                        {activeCommunity === community.id && (
                                            <ChevronRight className="h-4 w-4 text-orange-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section découverte recommandée */}
                        <div className="mb-4 px-2">
                            <div className="bg-gradient-to-br from-orange-50/50 to-white rounded-xl border border-orange-100 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600">
                                        <Globe className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-gray-900">
                                            Découvrez le campus
                                        </h4>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Explorez toutes les communautés et trouvez de nouveaux intérêts
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 h-8"
                                        >
                                            Explorer maintenant
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Paramètres et aide */}
                        <div className="px-2">
                            <div className="space-y-1">
                                {[
                                    { icon: Settings, label: 'Paramètres', badge: null },
                                    { icon: HelpCircle, label: 'Aide & Support', badge: null },
                                    { icon: Flag, label: 'Signaler un problème', badge: null },
                                ].map((item) => (
                                    <button
                                        key={item.label}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
                                    >
                                        <item.icon className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer avec statut - collé en bas */}
                <div className="p-4 border-t sticky bottom-0 bg-white">
                    <div className="rounded-lg bg-gradient-to-r from-gray-50 to-gray-100/50 p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-medium text-gray-900">
                                    {subscribedCommunities.length} communautés
                                </div>
                                <div className="text-xs text-gray-500">
                                    {filteredCommunities.length} disponibles
                                </div>
                            </div>
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal création communauté */}
            {showCreateModal && (
                <CreateCommunity onClose={() => setShowCreateModal(false)} />
            )}
        </>
    );
}