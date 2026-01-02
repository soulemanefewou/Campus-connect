import {
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
} from 'lucide-react';

export const mockCommunities = [
    { 
        id: '1', 
        name: 'Informatique', 
        members: 452, 
        icon: Code, 
        description: 'Programmation & tech', 
        color: 'bg-gradient-to-br from-blue-500 to-cyan-600', 
        trending: true, 
        subscribed: true 
    },
    { 
        id: '2', 
        name: 'Génie Civil', 
        members: 321, 
        icon: Building, 
        description: 'Construction & architecture', 
        color: 'bg-gradient-to-br from-orange-500 to-amber-600', 
        subscribed: true 
    },
    { 
        id: '3', 
        name: 'Promo 2024', 
        members: 1200, 
        icon: Users2, 
        description: 'Étudiants 2024', 
        color: 'bg-gradient-to-br from-purple-500 to-pink-600', 
        trending: true, 
        subscribed: true 
    },
    { 
        id: '4', 
        name: 'Club Musique', 
        members: 89, 
        icon: Music, 
        description: 'Concerts & jam sessions', 
        color: 'bg-gradient-to-br from-pink-500 to-rose-600' 
    },
    { 
        id: '5', 
        name: 'Bibliothèque', 
        members: 567, 
        icon: BookMarked, 
        description: 'Ressources & études', 
        color: 'bg-gradient-to-br from-green-500 to-emerald-600', 
        subscribed: true 
    },
    { 
        id: '6', 
        name: 'Cafétéria', 
        members: 234, 
        icon: Coffee, 
        description: 'Pause café & discussions', 
        color: 'bg-gradient-to-br from-amber-500 to-yellow-600' 
    },
    { 
        id: '7', 
        name: 'Amphi A', 
        members: 178, 
        icon: GraduationCap, 
        description: 'Cours & révisions', 
        color: 'bg-gradient-to-br from-indigo-500 to-blue-600' 
    },
    { 
        id: '8', 
        name: 'Podcast Campus', 
        members: 56, 
        icon: Mic2, 
        description: 'Émissions étudiantes', 
        color: 'bg-gradient-to-br from-rose-500 to-red-600' 
    },
    { 
        id: '9', 
        name: 'Jeux & Esport', 
        members: 312, 
        icon: Gamepad2, 
        description: 'Gaming & compétitions', 
        color: 'bg-gradient-to-br from-emerald-500 to-teal-600', 
        trending: true 
    },
    { 
        id: '10', 
        name: 'Champions', 
        members: 98, 
        icon: Trophy, 
        description: 'Sports & compétitions', 
        color: 'bg-gradient-to-br from-red-500 to-orange-600' 
    },
];