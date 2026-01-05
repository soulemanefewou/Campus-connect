'use client';

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs'; // Importer useUser

// Composant réutilisable pour le contenu de la sidebar
export function SidebarContent({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const { user } = useUser(); // Récupérer l'utilisateur
  
  // Passer clerkId à la query
  const communities = useQuery(api.communities.getUserCommunities, {
    clerkId: user?.id || undefined // Passer l'ID Clerk
  });

  const handleCreateCommunity = () => {
    // Créer un event personnalisé pour ouvrir le modal de création
    const event = new CustomEvent('openCreateCommunity', { 
      detail: { source: 'sidebar' }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-col h-full py-4">
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && <h2 className="text-xl font-bold text-gray-800">Communautés</h2>}
          {/* Bouton créer communauté visible mobile & desktop dans la sidebar */}
          <div>
            <button
              onClick={handleCreateCommunity}
              className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-orange-500 to-red-600 px-3 py-1 text-sm text-white hover:opacity-95 transition-opacity"
              title="Créer une communauté"
            >
              <Plus className="h-4 w-4" />
              {!isCollapsed && <span>Créer</span>}
            </button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1">
          {/* Lien Accueil */}
          <Link href="/" passHref>
            <Button
              variant="ghost"
              className={`w-full justify-start hover:bg-gray-50 ${isCollapsed ? 'px-2' : 'px-3'}`}
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              {!isCollapsed && <span className="ml-3 font-medium text-gray-700">Accueil</span>}
            </Button>
          </Link>

          <div className="my-4 border-t border-gray-100" />

          {!isCollapsed && (
            <div className="px-2 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Vos Communautés
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {communities?.length || 0} communauté(s)
              </p>
            </div>
          )}

          {communities === undefined ? (
            // Loading skeleton - adapté pour collapsed/non-collapsed
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex items-center gap-3 p-2 ${isCollapsed ? 'justify-center' : ''}`}>
                <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                {!isCollapsed && <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse" />}
              </div>
            ))
          ) : communities.length === 0 ? (
            !isCollapsed && (
              <div className="px-2 py-3 text-center">
                <div className="text-sm text-gray-500 mb-2">Vous n'avez rejoint aucune communauté.</div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCreateCommunity}
                  className="w-full border-dashed"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Rejoindre une communauté
                </Button>
              </div>
            )
          ) : (
            communities.map((community) => (
              <Link 
                key={community._id} 
                href={`/communities/${community._id}`} 
                className="block w-full"
              >
                <Button
                  variant="ghost"
                  className={`w-full justify-start hover:bg-gray-50 mb-1 h-auto py-2 ${isCollapsed ? 'px-2' : 'px-3'}`}
                  title={isCollapsed ? `r/${community.name}` : undefined}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={community.image} />
                    <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 text-xs font-bold">
                      {community.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="ml-3 text-left overflow-hidden">
                      <span className="font-medium text-gray-700 truncate block">
                        r/{community.name}
                      </span>
                      {community.description && (
                        <span className="text-xs text-gray-500 truncate block">
                          {community.description}
                        </span>
                      )}
                    </div>
                  )}
                </Button>
              </Link>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function SidebarLeft() {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
              <SidebarContent isCollapsed={isCollapsed} />
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
    </>
  );
}