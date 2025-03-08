'use client';
import { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { Db, Server, PrivateKey } from "@/app/utils/db";
import jwt from "jwt-simple";

export interface UserData {
    id: string;
    email?: string;
    name?: string;
    photo?: string;
    type?: string;
    x?: string;
    github?: string;
    website?: string;
    instagram?: string;
    linkedin?: string;
    [key: string]: any;
}

export interface CollectionData {
    name?: string;
    symbol?: string;
    size?: number;
    uri?: string;
    description?: string;
    address?: string;
    image?: string;
}

export interface GameData {
    id?: string;
    name?: string;
    genre?: string;
    publisher?: string;
    photo?: string;
    releaseDate?: string;
    description?: string;
    symbol?: string;
    address?: string;
}

export interface NFTData {
    address: string;
    name: string;
    description: string;
    symbol: string;
    image: string;
    external_link: string;
    owner: string;
    supply?: number;
    decimals?: number;
}

export interface TokenData {
    address?: string;
    image?: string;
    name?: string;
    symbol?: string;
    description?: string;
    uri?: string;
}

export interface AuthData {
    accessToken: string | null;
    refreshToken: string | null;
    userData: UserData | null;
    gameData: GameData[] | null;
    tokenData: TokenData | null;
    collectionData: CollectionData[] | null;
    isAuthenticated: boolean;
}

export interface AppContextData {
    auth: AuthData;
    setAccessToken: (accessToken: string) => void;
    setUser: (userData: UserData) => void;
    setGame: (gameData: GameData[]) => void;
    setTokenData: (tokenData: TokenData | null) => void;
    setCollectionData: (collectionData: CollectionData[] | null) => void;
    logout: () => void;
    getUser: () => UserData | null;
}

const AppContext = createContext<AppContextData | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
    const [auth, setAuth] = useState<AuthData>({
        accessToken: null,
        refreshToken: null,
        userData: null,
        gameData: null,
        tokenData: null,
        collectionData: null,
        isAuthenticated: false,

    });

    const setAccessToken = useCallback((accessToken: string) => {
        setAuth(prev => ({
            ...prev,
            accessToken,
            isAuthenticated: true,
        }));
    }, []);

    const setUser = useCallback((userData: UserData) => {
        setAuth(prev => ({
            ...prev,
            userData,
        }));

        // Only access localStorage on the client side
        if (typeof window !== 'undefined') {
            try {
                // Create JWT payload with user data and expiry
                const payload = {
                    userData,
                    exp: Math.floor((Date.now() + (2 * 60 * 60 * 1000)) / 1000) // 2 hours from now in seconds
                };

                // Sign the payload with private key to create JWT
                const token = jwt.encode(payload, PrivateKey || 'fallback-secret-key');

                // Store the signed JWT in localStorage
                console.log("setting user session", token);
                localStorage.setItem('userSession', token);
            } catch (error) {
                console.error('Error creating user session:', error);
                // Handle the error gracefully - maybe clear the session
                localStorage.removeItem('userSession');
            }
        }
    }, []);


    const getUser = useCallback(() => {
        try {
            // Only access localStorage on the client side
            if (typeof window === 'undefined') {
                return null;
            }

            // Get the stored JWT from localStorage
            const token = localStorage.getItem('userSession');

            if (!token) {
                setAuth(prev => ({ ...prev, userData: null }));
                return null;
            }

            // Verify and decode the JWT
            const decoded = jwt.decode(token, PrivateKey) as { userData: UserData; exp: number };
            console.log("getting user session", decoded);
            // Check if token has expired
            if (decoded.exp < Math.floor(Date.now() / 1000)) {
                localStorage.removeItem('userSession');
                setAuth(prev => ({ ...prev, userData: null }));
                return null;
            }
            setAuth(prev => ({ ...prev, userData: decoded.userData }));

            return decoded.userData;
        } catch (error) {
            // Only access localStorage on the client side
            if (typeof window !== 'undefined') {
                localStorage.removeItem('userSession');
            }
            setAuth(prev => ({ ...prev, userData: null }));
            return null;
        }
    }, []);

    const setGame = useCallback((gameData: GameData[]) => {
        setAuth(prev => ({
            ...prev,
            gameData,
        }));
    }, []);

    const setTokenData = useCallback((tokenData: TokenData | null) => {
        setAuth(prev => ({
            ...prev,
            tokenData,
        }));
    }, []);

    const setCollectionData = useCallback((collectionData: CollectionData[] | null) => {
        setAuth(prev => ({
            ...prev,
            collectionData,
        }));
    }, []);
    const logout = useCallback(() => {
        setAuth({
            accessToken: null,
            refreshToken: null,
            userData: null,
            gameData: null,
            tokenData: null,
            collectionData: null,
            isAuthenticated: false,
        });
        // Only access localStorage on the client side
        if (typeof window !== 'undefined') {
            localStorage.removeItem('userSession');
        }
    }, []);

    const value: AppContextData = {
        auth,
        setAccessToken,
        setUser,
        getUser,
        setGame,
        setTokenData,
        setCollectionData,
        logout
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}
