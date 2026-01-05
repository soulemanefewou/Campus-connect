'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Bell, Menu } from 'lucide-react';
import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { CreateCommunity } from '@/components/communities/CreateCommunity';
import { Users } from 'lucide-react';
import { SidebarContent } from '@/components/layout/SidebarLeft'; // Assurez-vous que le chemin est correct

export function NavBar() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateCommunity, setShowCreateCommunity] = useState(false);

    useEffect(() => {
        const handler = () => setShowCreateCommunity(true);
        window.addEventListener('openCreateCommunity', handler as EventListener);
        return () => window.removeEventListener('openCreateCommunity', handler as EventListener);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Recherche:', searchQuery);
        // Implémenter la logique de recherche
    };

    return (
        <nav className="sticky top-0 z-50 border-b bg-white shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">

                    {/* Logo et navigation gauche */}
                    <div className="flex items-center gap-4">

                        {/* Mobile Menu Trigger */}
                        <div className="lg:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="-ml-2">
                                        <Menu className="h-6 w-6" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
                                    <div className="h-full bg-white">
                                        {/* Utiliser SidebarContent dans le menu mobile */}
                                        <SidebarContent isCollapsed={false} />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600">
                                <span className="text-xl font-bold text-white">C</span>
                            </div>
                            <span className="hidden text-2xl font-bold text-gray-900 sm:inline">
                                Campus<span className="text-orange-600">Connect</span>
                            </span>
                        </Link>
                    </div>

                    {/* Barre de recherche centrale */}
                    <div className="hidden md:flex flex-1 max-w-2xl px-6">
                        <form onSubmit={handleSearch} className="relative w-full">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                type="search"
                                placeholder="Rechercher des communautés, posts ou utilisateurs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-full pl-10 pr-4"
                            />
                        </form>
                    </div>

                    {/* Actions droite */}
                    <div className="flex items-center gap-2">
                        {/* Bouton créer communauté - visible sur toutes tailles */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowCreateCommunity(true)}
                            title="Créer une communauté"
                        >
                            <Users className="h-5 w-5 text-orange-600" />
                        </Button>

                        {showCreateCommunity && (
                            <CreateCommunity onClose={() => setShowCreateCommunity(false)} />
                        )}

                        {/* Recherche Mobile (Icon only) */}
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Search className="h-5 w-5" />
                        </Button>

                        {/* Notifications */}
                        <SignedIn>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5" />
                                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                    3
                                </span>
                            </Button>
                        </SignedIn>

                        {/* Actions d'authentification */}
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                        <SignedOut>
                            <div className="hidden items-center gap-2 sm:flex">
                                <Link href="/sign-in">
                                    <Button variant="outline" className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800">
                                        Se connecter
                                    </Button>
                                </Link>
                                <Link href="/sign-up">
                                    <Button className="gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                                        S'inscrire
                                    </Button>
                                </Link>
                            </div>
                        </SignedOut>
                    </div>
                </div>
            </div>
        </nav>
    );
}