"use client";
import { AppProvider, useAppContext, UserData } from "@/app/utils/AppContext";
import MainUniverse from "./components/mainUniverse";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Db, Server } from "@/app/utils/db";
import SimpleLoading from "./components/simpleLoading";
import { set } from "date-fns";

interface InitialUserProps {
    rawUser?: any;
}

export default function DashboardClient({ rawUser }: InitialUserProps) {
    const { auth, setAccessToken, setUser, setGame, setTokenData, logout, getUser } = useAppContext();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let initialUser: UserData;
                if (rawUser) {
                    initialUser = JSON.parse(rawUser) as UserData;
                } else {
                    const user = getUser();
                    if (!user) {
                        throw new Error('No user found');
                    }
                    initialUser = user;
                }
                setIsLoading(true);
                console.log("this is data", initialUser);
                setUser(initialUser);
            } catch (error) {
                console.error('Error fetching data:', error);
                router.push("/dashboard/login");
            } finally {
                setIsLoading(false);
                // alert("Thank you for registering with CoLaunch!, Dashboard will publicly accessible soon!");
                // router.push("/");
            }
        };

        fetchData();
    }, []);

    return isLoading ? <SimpleLoading /> : <MainUniverse />;
}
