import { Db } from '@/app/utils/db';
import { useState, FormEvent, ChangeEvent } from 'react';
import { FaImage } from 'react-icons/fa';
import { AppProvider, GameData, useAppContext } from "@/app/utils/AppContext";
interface CollectionFormData {
    name: string;
    symbol: string;
    description: string;
    image: File | null;
    size: number;
}

interface CreateCollectionFormProps {
    setShowCreateForm: (show: boolean) => void;
    selectedGame: GameData;
}

export default function CreateCollectionForm({ setShowCreateForm, selectedGame }: CreateCollectionFormProps) {
    const { auth, setTokenData, setCollectionData } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [collectionForm, setCollectionForm] = useState<CollectionFormData>({
        name: '',
        symbol: '',
        description: '',
        image: null,
        size: 0,
    });

    const handleCollectionChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'file') {
            const fileInput = e.target as HTMLInputElement;
            const file = fileInput.files?.[0];

            if (file) {
                if (file.size > 10 * 1024 * 1024) {
                    alert('File size must be less than 10MB');
                    fileInput.value = '';
                    return;
                }
                setCollectionForm(prev => ({
                    ...prev,
                    image: file
                }));
            }
        } else {
            setCollectionForm(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 2));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (currentStep !== 2) {
            nextStep();
            return;
        }
        try {
            setIsLoading(true);
            // TODO: Implement collection creation logic
            console.log('Creating collection:', collectionForm);
            //  Handle photo upload to Supabase storage
            let photoUrl = "";
            if (collectionForm.image) {
                const upload_name = `photo/collection-${Date.now()}-${collectionForm.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                const { data: uploadData, error: uploadError } = await Db.storage
                    .from('metaloot')
                    .upload(upload_name, collectionForm.image);

                if (uploadError) {
                    console.error('Error uploading photo:', uploadError);
                    return;
                }
                console.log("upload Image Successfully", uploadData)
                // Get public URL for the uploaded photo
                const { data: { publicUrl } } = Db.storage
                    .from('metaloot')
                    .getPublicUrl(uploadData.path);
                console.log("publicUrl", publicUrl)
                photoUrl = publicUrl;
            }
            const metadata = {
                name: collectionForm.name,
                symbol: collectionForm.symbol,
                description: collectionForm.description,
                external_url: "https://metaloot.dev",
                image: photoUrl,
                collection_details: {
                    size: collectionForm.size,
                },
                attributes: [],
                properties: {
                    category: "image",
                    creators: [
                        {
                            address: selectedGame.address,
                            share: 100
                        }
                    ]
                }
            };

            const metadataBlob = new Blob([JSON.stringify(metadata)], {
                type: 'application/json'
            });
            let metadata_name = `metadata/collection-${Date.now()}-${collectionForm.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            const { data: uploadData, error: uploadError } = await Db.storage
                .from('metaloot')
                .upload(metadata_name, metadataBlob);

            if (uploadError) {
                console.error('Error uploading metadata:', uploadError);
                return;
            }
            console.log("upload Metadata Successfully", uploadData)
            // Get public URL for the uploaded photo
            const { data: { publicUrl } } = Db.storage
                .from('metaloot')
                .getPublicUrl(uploadData.path);

            console.log("metadata", publicUrl)

            const response = await fetch('https://metaloot-cloud-d4ec.shuttle.app/v1/api/collection', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        name: collectionForm.name,
                        symbol: collectionForm.symbol,
                        size: Number(collectionForm.size),
                        uri: publicUrl
                    }
                )
            });
            if (!response.ok) {
                throw new Error('Failed to create collection');
            }
            const data = await response.json();
            console.log("data", data)
            let collection_address = data.address;
            let collectionData_old = auth.collectionData;
            const collectionData_new = {
                name: collectionForm.name,
                symbol: collectionForm.symbol,
                uri: publicUrl,
                image: photoUrl,
                description: collectionForm.description,
                address: collection_address,
            };
            if (collectionData_old) {
                collectionData_old.push(collectionData_new);
            } else {
                setCollectionData([collectionData_new]);
            }
            console.log("Create collection Successfully ,", collection_address);
        } catch (error) {
            console.error('Error creating collection:', error)
        } finally {
            setIsLoading(false);
            setShowCreateForm(false);
        };
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 pt-20">
            <div className="h-screen flex flex-col items-center justify-center relative w-full">
                {isLoading ? (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-12 h-12 border-4 border-white/10 border-t-[#0CC0DF] rounded-full animate-spin"></div>
                        <p className="text-white/60">Creating collection...</p>
                    </div>
                ) : (
                    <div className="text-center space-y-8 mb-32">
                        {/* Collection Preview Display */}
                        <div className="relative">
                            <div className="w-32 h-32 mx-auto bg-black border border-white/10 rounded-full flex items-center justify-center relative z-10">
                                {collectionForm.image ? (
                                    <img
                                        src={URL.createObjectURL(collectionForm.image)}
                                        alt="Collection preview"
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    <span className="text-white text-4xl font-bold">
                                        {collectionForm.symbol?.[0] || '?'}
                                    </span>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0CC0DF]/20 to-[#14F195]/20 blur-xl rounded-full transform scale-150 -z-0"></div>
                            <div className="mt-4 text-center">
                                <h3 className="text-white text-xl font-bold">
                                    {collectionForm.name || 'Collection Name'}
                                </h3>
                                <p className="text-white/60 text-sm mt-1">
                                    {collectionForm.symbol || 'SYMBOL'}
                                </p>
                            </div>
                        </div>

                        {/* Step indicators */}
                        <div className="mt-8 flex justify-center gap-2">
                            {[1, 2].map((step) => (
                                <div
                                    key={step}
                                    className={`w-2 h-2 rounded-full ${currentStep >= step ? 'bg-[#0CC0DF]' : 'bg-white/10'}`}
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
                                        value={collectionForm.name}
                                        onChange={handleCollectionChange}
                                        placeholder="Collection Name"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="symbol"
                                        value={collectionForm.symbol}
                                        onChange={handleCollectionChange}
                                        placeholder="Collection Symbol"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                                        required
                                    />
                                    <input
                                        type="number"
                                        name="size"
                                        value={collectionForm.size}
                                        onChange={handleCollectionChange}
                                        placeholder="Collection Size"
                                        min="1"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                                        required
                                    />
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-4">
                                    <input
                                        type="file"
                                        name="image"
                                        accept="image/*"
                                        onChange={handleCollectionChange}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                                        required
                                    />
                                    <textarea
                                        name="description"
                                        value={collectionForm.description}
                                        onChange={handleCollectionChange}
                                        placeholder="Collection Description"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white h-32"
                                        required
                                    />
                                </div>
                            )}

                            <div className="flex gap-4 mt-6">
                                {currentStep > 1 && (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="flex-1 px-6 py-3 border border-white/10 rounded-lg text-white/60 hover:text-white hover:border-white/30 transition-all duration-300"
                                    >
                                        Back
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0CC0DF] to-[#14F195] rounded-lg text-black font-medium hover:opacity-90 transition-opacity"
                                >
                                    {currentStep === 2 ? 'Post Idea' : 'Next'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Close Button */}
                <button
                    onClick={() => setShowCreateForm(false)}
                    className="absolute top-8 right-8 text-white/60 hover:text-white text-4xl font-bold"
                >
                    ×
                </button>
            </div>
        </div>
    );
}
