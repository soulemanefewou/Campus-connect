'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Home, TrendingUp, Bell, User, LogIn, UserPlus, Menu } from 'lucide-react';
import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function NavBar() {
    const [searchQuery, setSearchQuery] = useState('');

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
                                <SheetContent side="left" className="w-[300px] p-0">
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
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-500">
                                    Ctrl+K
                                </span>
                            </div>
                        </form>
                    </div>

                    {/* Actions droite */}
                    <div className="flex items-center gap-2">
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
                            <>
                                {/* Menu utilisateur */}
                                <UserButton />
                            </>
                        </SignedIn>
                        <SignedOut>
                            <>
                                {/* Boutons connexion/inscription - Desktop */}
                                <div className="hidden items-center gap-2 sm:flex">
                                    <Link href="/sign-in">
                                        <Button variant="outline" className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800">
                                            <LogIn className="h-4 w-4" />
                                            Se connecter
                                        </Button>
                                    </Link>
                                    <Link href="/sign-up">
                                        <Button className="gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                                            <UserPlus className="h-4 w-4" />
                                            S'inscrire
                                        </Button>
                                    </Link>
                                </div>

                                {/* Version mobile - Boutons via le menu hamburger (Sidebar) maintenant */}
                                {/* Plus de bouton Auth dédié ici pour cleaner la navbar */}
                            </>
                        </SignedOut>
                    </div>
                </div>

                {/* Navigation mobile secondaire (si nécessaire) */}
                {/* <div className="flex items-center justify-between border-t py-2 md:hidden">
          <Button variant="ghost" size="sm" className="flex-1">
            <Search className="mr-2 h-4 w-4" />
            Rechercher
          </Button>
        </div> */}
            </div>
        </nav>
    );
}