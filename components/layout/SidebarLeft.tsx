'use client';

import { useStore } from '@/store/useStore';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

export default function SidebarLeft() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const communities = useQuery(api.communities.getUserCommunities);

  // Détecter mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-4">
      <div className="px-4 mb-4">
        {!isCollapsed && <h2 className="text-xl font-bold text-gray-800">Communautés</h2>}
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1">
          {/* Lien Accueil */}
          <Link href="/" passHref>
            <Button
              variant="ghost"
              className={`w-full justify-start ${isCollapsed ? 'px-2' : ''}`}
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              {!isCollapsed && <span className="ml-3 font-medium text-gray-700">Accueil</span>}
            </Button>
          </Link>

          <div className="my-4 border-t border-gray-100" />

          {!isCollapsed && <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Vos Communautés</h3>}

          {communities === undefined ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                {!isCollapsed && <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />}
              </div>
            ))
          ) : communities.length === 0 ? (
            !isCollapsed && <div className="px-2 text-sm text-gray-500 italic">Vous n'avez rejoint aucune communauté.</div>
          ) : (
            communities.map((community) => (
              <Link key={community._id} href={`/communities/${community._id}`} passHref className="w-full">
                <Button
                  variant="ghost"
                  className={`w-full justify-start mb-1 h-auto py-2 ${isCollapsed ? 'px-2' : ''}`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={community.image} />
                    <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 text-xs font-bold">
                      {community.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && <span className="ml-3 font-medium text-gray-700 truncate">{community.name}</span>}
                </Button>
              </Link>
            ))
          )}

        </div>
      </ScrollArea>
    </div>
  );

  return (
    <>
      {/* Version Desktop - Sidebar fixe avec contenu scrollable */}
      <aside className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)]">
        <div className="h-full flex">
          {/* Sidebar principale */}
          <div className={`
            relative transition-all duration-300 ease-in-out 
            ${isCollapsed ? 'w-20' : 'w-64'}
          `}>
            {/* Container avec effet de verre */}
            <div className="h-full rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
              {/* Contenu qui gère son propre scroll */}
              <SidebarContent />
            </div>

            {/* Bouton toggle collapse */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute -right-3 top-6 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
              aria-label={isCollapsed ? "Étendre la sidebar" : "Réduire la sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Version Mobile - Sheet */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-gray-600 hover:text-orange-600"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
            <div className="h-full bg-white">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}