"use client"

import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Globe } from 'lucide-react';

export function SidebarRight() {
  const router = useRouter();
  const communities = useQuery(api.communities.getAllCommunities);
  const joinCommunity = useMutation(api.communities.joinCommunity);
  const leaveCommunity = useMutation(api.communities.leaveCommunity);

  const handleToggleFollow = async (e: React.MouseEvent, communityId: Id<"communities">, communityName: string, isJoined: boolean) => {
    e.stopPropagation();
    try {
      if (isJoined) {
        await leaveCommunity({ communityId });
        toast.success(`Vous ne suivez plus ${communityName}`);
      } else {
        await joinCommunity({ communityId });
        toast.success(`Vous avez rejoint ${communityName}`);
      }
    } catch (error) {
      toast.error("Erreur lors de l'action");
      console.error(error);
    }
  };

  const handleNavigate = (communityId: string) => {
    router.push(`/communities/${communityId}`);
  }

  const SidebarContent = () => (
    <div className="h-full overflow-y-auto">
      {/* Suggestions de communautés */}
      <div className="rounded-xl bg-gray-50/50 p-4 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Communautés</h2>

        <div className="space-y-4">
          {communities === undefined ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))
          ) : communities.length === 0 ? (
            <div className="text-sm text-gray-500">Aucune communauté disponible.</div>
          ) : (
            communities.slice(0, 10).map((community) => (
              <div
                key={community._id}
                className="flex items-center justify-between group cursor-pointer"
                onClick={() => handleNavigate(community._id)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Avatar className="h-10 w-10 border border-gray-200">
                    <AvatarImage src={community.image} />
                    <AvatarFallback className="bg-white text-gray-700 font-bold">
                      {community.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm truncate group-hover:underline">
                      r/{community.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">{community.memberCount} membres</p>
                  </div>
                </div>
                <Button
                  variant={community.isJoined ? "outline" : "secondary"}
                  size="sm"
                  className={`rounded-full px-4 h-8 text-xs font-bold transition-all active:scale-95 ${community.isJoined
                      ? "border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}
                  onClick={(e) => handleToggleFollow(e, community._id, community.name, community.isJoined)}
                >
                  {community.isJoined ? "Suivi" : "Suivre"}
                </Button>
              </div>
            ))
          )}
        </div>

        {communities && communities.length > 10 && (
          <Button variant="ghost" className="w-full mt-4 text-orange-500 hover:text-orange-600 hover:bg-orange-50 text-sm">
            Voir plus
          </Button>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-400 px-4 pb-4">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <span className="hover:underline cursor-pointer">Conditions</span>
          <span className="hover:underline cursor-pointer">Confidentialité</span>
          <span className="hover:underline cursor-pointer">Cookies</span>
          <span className="hover:underline cursor-pointer">Plus</span>
        </div>
        <div className="mt-2">
          Campus Connect © 2024.
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden xl:block sticky top-16 h-[calc(100vh-4rem)]">
        <SidebarContent />
      </div>

      <div className="xl:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:text-orange-600"
            >
              <Globe className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-sm p-4 pt-10">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}