'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Lock, Globe, Users, Image } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/nextjs'; // Ajouter useUser

interface CreateCommunityProps {
  onClose: () => void;
}

const communityTypes = [
  { id: 'public', name: 'Publique', icon: Globe, description: 'Visible par tous, tout le monde peut poster' },
  { id: 'private', name: 'Privée', icon: Lock, description: 'Visible et accessible sur invitation seulement' },
];

export function CreateCommunity({ onClose }: CreateCommunityProps) {
  const { user, isLoaded } = useUser();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [communityType, setCommunityType] = useState<'public' | 'private'>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const createCommunity = useMutation(api.communities.createCommunity);
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier que l'utilisateur est chargé et connecté
    if (!isLoaded) {
      toast.error("Chargement de l'authentification...");
      return;
    }
    
    if (!user) {
      toast.error("Veuillez vous connecter pour créer une communauté");
      return;
    }

    setIsSubmitting(true);

    try {
      let storageId: Id<"_storage"> | undefined = undefined;

      if (selectedImage) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });

        if (!result.ok) throw new Error("Upload failed");

        const json = await result.json();
        storageId = json.storageId;
      }

      await createCommunity({
        name,
        slug: generateSlug(name),
        description,
        image: storageId,
        communityType,
        clerkId: user.id, // Passer l'ID Clerk ici
      });

      toast.success('Communauté créée avec succès !');
      onClose();
    } catch (error) {
      console.error("Failed to create community:", error);
      toast.error("Erreur lors de la création de la communauté.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTypeData = communityTypes.find(type => type.id === communityType);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600">
                <Users className="h-4 w-4 text-white" />
              </div>
              <span>Créer une communauté</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Nom de la communauté */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom de la communauté <span className="text-red-500">*</span>
            </Label>
            <div className="flex">
              <div className="flex items-center rounded-l-md border border-r-0 bg-gray-50 px-3 text-gray-500">
                r/
              </div>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="informatique, musique, sports..."
                required
                maxLength={21}
                className="rounded-l-none"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Slug: {generateSlug(name)}
              </span>
              <span className={`font-medium ${name.length >= 21 ? 'text-red-500' : 'text-gray-500'}`}>
                {name.length}/21
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le but de votre communauté..."
              required
              rows={3}
              maxLength={500}
            />
            <div className="text-right text-sm text-gray-500">
              {description.length}/500
            </div>
          </div>

          {/* Type de communauté */}
          <div className="space-y-3">
            <Label>Type de communauté</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {communityTypes.map((type) => (
                <Button
                  key={type.id}
                  type="button"
                  variant={communityType === type.id ? 'default' : 'outline'}
                  className={`h-auto flex-col items-start p-4 text-left ${communityType === type.id ? 'bg-blue-600 hover:bg-blue-700 border-blue-600' : 'hover:border-blue-300'}`}
                  onClick={() => setCommunityType(type.id as 'public' | 'private')}
                >
                  <type.icon className="mb-2 h-5 w-5" />
                  <div className="font-medium">{type.name}</div>
                  <div className="mt-1 text-xs opacity-80">{type.description}</div>
                </Button>
              ))}
            </div>
          </div>

          {/* Image de communauté (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="image">Image de communauté</Label>
            <div className="flex items-center gap-4">
              <div
                className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-gray-300 overflow-hidden hover:bg-gray-50"
                onClick={() => imageInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <Image className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  Ajoutez une image pour personnaliser votre communauté
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => imageInputRef.current?.click()}
                >
                  Télécharger une image
                </Button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !description.trim() || isSubmitting || !user} // Désactiver si pas d'utilisateur
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Création...
                </div>
              ) : (
                'Créer la communauté'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}