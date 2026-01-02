'use client';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui/select';
import { X, Image, User } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';

interface CreatePostProps {
  onClose: () => void;
}

export function CreatePost({ onClose }: CreatePostProps) {
  
  const { user } = useUser();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState<string>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const createPost = useMutation(api.posts.createPost);
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
  const userCommunities = useQuery(api.communities.getUserCommunities);
  const createdCommunities = useQuery(api.communities.getCreatedCommunities);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("L'image ne doit pas dépasser 5MB");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let storageId: Id<"_storage"> | undefined = undefined;

      if (selectedImage) {
        // 1. Get upload URL
        const postUrl = await generateUploadUrl();

        // 2. Upload file
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });

        if (!result.ok) throw new Error("Upload failed");

        const json = await result.json();
        storageId = json.storageId;
      }

      // 3. Create post
      const communityId = selectedCommunity === 'profile' ? undefined : selectedCommunity as Id<"communities">;

      await createPost({
        title,
        content,
        communityId,
        image: storageId,
      });

      toast.success('Publication créée avec succès !');
      onClose();
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création de la publication.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrer les communautés suivies pour exclure celles déjà dans créées
  const followedCommunities = userCommunities?.filter(followedCommunity => {
    return !createdCommunities?.some(createdCommunity =>
      createdCommunity._id === followedCommunity._id
    );
  });

  // Vérifier si l'utilisateur a des communautés
  const hasCommunities = 
    (createdCommunities && createdCommunities.length > 0) || 
    (followedCommunities && followedCommunities.length > 0);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold">
            Créer une publication
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Sélection de la communauté */}
          <div className="space-y-3">
            <Label htmlFor="community" className="text-sm font-medium">
              Publier sur
            </Label>
            <Select value={selectedCommunity} onValueChange={setSelectedCommunity}>
              <SelectTrigger className="w-full h-11 border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                <SelectValue placeholder="Choisir où publier..." />
              </SelectTrigger>
              <SelectContent className="max-h-80 w-[var(--radix-select-trigger-width)] min-w-[300px]">
                <SelectGroup>
                  <SelectLabel className="text-xs font-semibold text-gray-500 px-2 py-1.5 uppercase tracking-wider">
                    Mon Espace
                  </SelectLabel>
                  {/* Option Profil Utilisateur - UNIQUEMENT ICI avec value="profile" */}
                  <SelectItem value="profile" className="py-2.5 cursor-pointer focus:bg-orange-50">
                    <div className="grid grid-cols-[auto_1fr] items-center gap-3 w-full">
                      <Avatar className="h-8 w-8 border border-gray-200 shrink-0">
                        <AvatarImage src={user?.imageUrl} />
                        <AvatarFallback className="bg-gray-100">
                          <User className="h-4 w-4 text-gray-500" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate text-sm">Mon Profil</span>
                        <span className="text-xs text-gray-500 truncate">Publication personnelle</span>
                      </div>
                    </div>
                  </SelectItem>
                </SelectGroup>

                {/* Communautés créées par l'utilisateur */}
                {createdCommunities && createdCommunities.length > 0 && (
                  <>
                    <SelectSeparator className="my-1" />
                    <SelectGroup>
                      <SelectLabel className="text-xs font-semibold text-gray-500 px-2 py-1.5 uppercase tracking-wider">
                        Mes Communautés (Admin)
                      </SelectLabel>
                      {createdCommunities.map((community) => (
                        <SelectItem
                          key={community._id}
                          value={community._id}
                          className="py-2.5 cursor-pointer focus:bg-orange-50"
                        >
                          <div className="grid grid-cols-[auto_1fr] items-center gap-3 w-full">
                            <Avatar className="h-8 w-8 border border-gray-200 shrink-0">
                              {community.image ? (
                                <AvatarImage src={community.image} alt={community.name} className="object-cover" />
                              ) : (
                                <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-xs">
                                  {community.name?.substring(0, 2).toUpperCase() || '??'}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex flex-col min-w-0 text-left">
                              <span className="font-medium truncate text-sm">r/{community.name}</span>
                              {community.description && (
                                <span className="text-xs text-gray-500 truncate block">
                                  {community.description}
                                </span>
                              )}
                              <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded-full w-fit mt-0.5">
                                Admin
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </>
                )}

                {/* Communautés suivies (excluant celles déjà créées) */}
                {followedCommunities && followedCommunities.length > 0 && (
                  <>
                    <SelectSeparator className="my-1" />
                    <SelectGroup>
                      <SelectLabel className="text-xs font-semibold text-gray-500 px-2 py-1.5 uppercase tracking-wider">
                        Communautés suivies
                      </SelectLabel>
                      {followedCommunities.map((community) => (
                        <SelectItem
                          key={community._id}
                          value={community._id}
                          className="py-2.5 cursor-pointer focus:bg-orange-50"
                        >
                          <div className="grid grid-cols-[auto_1fr] items-center gap-3 w-full">
                            <Avatar className="h-8 w-8 border border-gray-200 shrink-0">
                              {community.image ? (
                                <AvatarImage src={community.image} alt={community.name} className="object-cover" />
                              ) : (
                                <AvatarFallback className="bg-orange-50 text-orange-600 font-bold text-xs">
                                  {community.name?.substring(0, 2).toUpperCase() || '??'}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex flex-col min-w-0 text-left">
                              <span className="font-medium truncate text-sm">r/{community.name}</span>
                              {community.description && (
                                <span className="text-xs text-gray-500 truncate block">
                                  {community.description}
                                </span>
                              )}
                              <span className="text-[10px] text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-full w-fit mt-0.5">
                                {community.communityType === 'private' ? 'Privée' : 'Publique'}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </>
                )}

                {/* Message si pas de communautés - CORRIGÉ : Utiliser un div au lieu d'un SelectItem */}
                {!hasCommunities && (
                  <div className="px-2 py-3 text-center text-gray-500 text-sm">
                    Vous n'avez créé ou suivi aucune communauté
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Titre */}
          <div className="space-y-3">
            <Label htmlFor="title" className="text-sm font-medium">
              Titre *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Un titre accrocheur..."
              required
              maxLength={300}
              className="h-12 text-base border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {selectedCommunity === 'profile'
                  ? 'Publication sur votre profil personnel'
                  : 'Publication dans une communauté'}
              </span>
              <span className={`text-xs ${title.length > 280 ? 'text-red-500' : 'text-gray-500'}`}>
                {title.length}/300
              </span>
            </div>
          </div>

          {/* Contenu */}
          <div className="space-y-3">
            <Label htmlFor="content" className="text-sm font-medium">
              Contenu
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Partagez vos idées, posez une question, ou lancez une discussion..."
              rows={6}
              className="min-h-[150px] resize-y border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <div className="text-xs text-gray-500">
              Le contenu est optionnel pour les posts avec image, mais recommandé pour enrichir la publication
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Image (Optionnel)</Label>
              <span className="text-xs text-gray-500">Max 5MB</span>
            </div>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => imageInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative w-full max-h-60 overflow-hidden rounded-lg">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-contain max-h-60"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 bg-white border border-gray-300 shadow-sm hover:bg-gray-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                      setSelectedImage(null);
                      if (imageInputRef.current) imageInputRef.current.value = '';
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100">
                    <Image className="h-6 w-6 text-orange-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">
                      Cliquez pour ajouter une image
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, WEBP
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    Choisir un fichier
                  </Button>
                </div>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>
          </div>

          {/* Actions */}
          <DialogFooter className="pt-6 border-t border-gray-200 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Publication...
                </div>
              ) : (
                'Publier'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}