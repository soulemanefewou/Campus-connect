import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { Toaster } from 'react-hot-toast';


import SidebarLeft from '@/components/layout/SidebarLeft';
import { SidebarRight } from '@/components/layout/SidebarRight';

const RootLayout = async ({ children }: { children: ReactNode }) => {

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />

            <div className="container mx-auto px-0 py-4 md:py-6">
                <div className="flex gap-4 md:gap-6 px-3 md:px-4 lg:px-0">
                    {/* Sidebar gauche - Communautés */}
                    <SidebarLeft />

                    {/* Colonne centrale */}
                    <main className="flex-1 min-w-0 w-full max-w-3xl mx-auto">
                        <div className="space-y-4 md:space-y-6">
                            {children}
                        </div>
                    </main>

                    {/* Sidebar droite - Infos communauté */}
                    <SidebarRight />
                </div>
            </div>
            <Toaster />
        </div>
    )
};

export default RootLayout;