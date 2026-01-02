import { ReactNode } from "react";
import { redirect } from "next/navigation";


const AuthLayout = async ({ children }: { children: ReactNode }) => {

    return <div className="flex min-h-screen items-center justify-center bg-background">
        {children}
    </div>;
};

export default AuthLayout;