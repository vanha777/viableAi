'use client'

import { Db } from '@/app/utils/db'
import { motion } from 'framer-motion'
import { useState, FormEvent, ChangeEvent } from 'react'
import { AppProvider, useAppContext } from "@/app/utils/AppContext";
import SimpleLoading from './simpleLoading';

interface CreateGameFormProps {
    setIsCreateOverlayOpen: (isOpen: boolean) => void
}

interface FormDataType {
    name: string
    genre: string
    publisher: string
    releaseDate: string
    photo: File | null
    symbol: string
    description: string
}

export default function CreateGameForm({ setIsCreateOverlayOpen }: CreateGameFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { auth, setGame } = useAppContext();
    const [currentStep, setCurrentStep] = useState(1)
    const [formData, setFormData] = useState<FormDataType>({
        name: '',
        genre: '',
        publisher: '',
        releaseDate: '',
        photo: null,
        symbol: '',
        description: ''
    })

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target

        if (type === 'file') {
            const fileInput = e.target as HTMLInputElement
            const file = fileInput.files?.[0]

            if (file) {
                // Check file size (10MB = 10 * 1024 * 1024 bytes)
                if (file.size > 10 * 1024 * 1024) {
                    alert('File size must be less than 10MB')
                    fileInput.value = ''
                    return
                }

                setFormData(prev => ({
                    ...prev,
                    [name]: file
                }))
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }))
        }
    }

    const nextStep = () => {
        setCurrentStep(prev => Math.min(prev + 1, 3))
    }

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1))
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (currentStep !== 3) {
            nextStep();
            return;
        } else {
            setIsLoading(true)
            console.log("submitting", formData)
            try {
                //  Handle photo upload to Supabase storage
                let photoUrl = "";
                if (formData.photo) {
                    let upload_name = `photo/game-${Date.now()}-${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                    const { data: uploadData, error: uploadError } = await Db.storage
                        .from('metaloot')
                        .upload(upload_name, formData.photo);

                    if (uploadError) {
                        console.error('Error uploading photo:', uploadError);
                        return;
                    }
                    console.log("uploadData", uploadData)
                    // Get public URL for the uploaded photo
                    const { data: { publicUrl } } = Db.storage
                        .from('metaloot')
                        .getPublicUrl(uploadData.path);

                    console.log("publicUrl", publicUrl)
                    photoUrl = publicUrl;
                }
                const metadata = {
                    name: formData.name,
                    symbol: formData.symbol,
                    description: formData.description,
                    image: photoUrl,
                    attributes: [
                        {
                            trait_type: "genre",
                            value: formData.genre
                        },
                        {
                            trait_type: "publisher",
                            value: formData.publisher
                        },
                        {
                            trait_type: "released_date",
                            value: formData.releaseDate
                        },
                        {
                            trait_type: "logo",
                            value: photoUrl
                        }
                    ],
                    properties: {
                        category: "image",
                        creators: [
                            {
                                address: "GA4jV9ESNBwjxQKs6HgoSebTFTMztacZPCYv8NCs8y8J",
                                share: 100
                            }
                        ],
                        files: [
                            {
                                uri: photoUrl,
                                type: formData.photo?.type
                            }
                        ]
                    }
                };

                const metadataBlob = new Blob([JSON.stringify(metadata)], {
                    type: 'application/json'
                });
                let metadata_name = `metadata/game-${Date.now()}-${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                const { data: uploadData, error: uploadError } = await Db.storage
                    .from('metaloot')
                    .upload(metadata_name, metadataBlob);

                if (uploadError) {
                    console.error('Error uploading photo:', uploadError);
                    return;
                }
                console.log("uploadData", uploadData)
                // Get public URL for the uploaded photo
                const { data: { publicUrl } } = Db.storage
                    .from('metaloot')
                    .getPublicUrl(uploadData.path);

                console.log("metadata", publicUrl)
                let uniqueId = formData.name.toLowerCase().replace(/ /g, '').replace(/[^a-z0-9]/g, '');


                const response = await fetch('https://metaloot-cloud-d4ec.shuttle.app/v1/api/game', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        game_id: uniqueId,
                        name: formData.name,
                        symbol: formData.symbol,
                        uri: publicUrl,
                        native_token: null,
                        nft_collection: null
                    })
                });


                if (!response.ok) {
                    throw new Error('Failed to create game');
                }

                const data = await response.json();
                let game_address = data.address;

                //update game_registries table
                const { data: gameRegistryData, error: gameRegistryError } = await Db.from('game_registries').insert({
                    game_id: uniqueId,
                    game_uri: publicUrl,
                    address: game_address,
                    user_id: auth.userData?.id,
                })
                console.log("gameRegistryData", gameRegistryData)
                let prevGames = auth.gameData ?? [];
                prevGames.push({
                    id: uniqueId,
                    name: formData.name,
                    photo: photoUrl,
                    description: formData.description || '',
                    symbol: formData.symbol || '',
                    genre: formData.genre || '',
                    publisher: formData.publisher || '',
                    releaseDate: formData.releaseDate || '',
                    address: game_address
                });
                setGame(prevGames);
            } catch (error) {
                console.error('Error handling photo upload:', error);
                setIsLoading(false)
                setIsCreateOverlayOpen(false)
                return;
            }
            setIsLoading(false)
            setIsCreateOverlayOpen(false)
            console.log("Create game Successfully");

        }

    }

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
            {isLoading ? (
                <SimpleLoading />
            ) : (
                <div className="h-screen flex flex-col items-center justify-center relative w-full">
                    {/* Game Preview Display */}
                    <div className="text-center space-y-8 mb-32">
                        <div className="relative">
                            <div className="w-32 h-32 mx-auto bg-black border border-white/10 rounded-full 
                                        flex items-center justify-center relative z-10">
                                {formData.photo ? (
                                    <img
                                        src={URL.createObjectURL(formData.photo)}
                                        alt="Game preview"
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    <span className="text-white text-4xl font-bold">
                                        {formData.name?.[0] || '?'}
                                    </span>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0CC0DF]/20 to-[#14F195]/20 
                                        blur-xl rounded-full transform scale-150 -z-0"></div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-white/60 text-sm tracking-wider">GAME KEY</h2>
                            <h1 className="text-white text-5xl font-light tracking-wider">
                                {formData.name || 'New Game'}
                            </h1>
                            <p className="text-white/40 text-xl">{formData.releaseDate || '2024'}</p>
                        </div>

                        {/* Form Steps */}
                        <div className="mt-8 flex justify-center gap-2">
                            {[1, 2, 3].map((step) => (
                                <div
                                    key={step}
                                    className={`w-2 h-2 rounded-full ${currentStep >= step
                                        ? 'bg-[#0CC0DF]'
                                        : 'bg-white/10'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Form Content */}
                        <form onSubmit={handleSubmit} className="mt-8 w-[480px] mx-auto">
                            {currentStep === 1 && (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Game Name"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="genre"
                                        value={formData.genre}
                                        onChange={handleInputChange}
                                        placeholder="Genre"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="publisher"
                                        value={formData.publisher}
                                        onChange={handleInputChange}
                                        placeholder="Publisher"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                                        required
                                    />
                                    <input
                                        type="date"
                                        name="releaseDate"
                                        value={formData.releaseDate}
                                        onChange={handleInputChange}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                                        required
                                    />
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-4">
                                    <input
                                        type="file"
                                        name="photo"
                                        accept="image/*"
                                        onChange={handleInputChange}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="symbol"
                                        value={formData.symbol}
                                        onChange={handleInputChange}
                                        placeholder="Game Symbol"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                                        required
                                    />
                                </div>
                            )}

                            {currentStep === 3 && (
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Game Description"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white h-32"
                                    required
                                />
                            )}

                            <div className="flex gap-4 mt-6">
                                {currentStep > 1 && (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="flex-1 px-6 py-3 border border-white/10 rounded-lg text-white/60 
                                                 hover:text-white hover:border-white/30 transition-all duration-300"
                                    >
                                        Back
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0CC0DF] to-[#14F195] 
                                             rounded-lg text-black font-medium hover:opacity-90 transition-opacity"
                                >
                                    {currentStep === 3 ? 'Create Game' : 'Next'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={() => setIsCreateOverlayOpen(false)}
                        className="absolute top-4 right-4 text-white/40 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
}
