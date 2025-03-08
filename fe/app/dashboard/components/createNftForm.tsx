import { Db } from '@/app/utils/db';
import { useState, FormEvent, ChangeEvent } from 'react';
import { FaImage } from 'react-icons/fa';
import { AppProvider, GameData, NFTData, useAppContext } from "@/app/utils/AppContext";
interface NFTFormData {
    name: string;
    symbol: string;
    description: string;
    image: File | null;
    attributes: { trait_type: string; value: string }[];
}

interface CreateNFTFormProps {
    setShowCreateForm: (show: boolean) => void;
    selectedCollection: string;
}

export default function CreateNFTForm({ setShowCreateForm, selectedCollection, collectionNFTs, setCollectionNFTs }: CreateNFTFormProps & {
    collectionNFTs: NFTData[];
    setCollectionNFTs: (nfts: NFTData[]) => void;
}) {
    const { auth, setTokenData, setCollectionData } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [nftForm, setNftForm] = useState<NFTFormData>({
        name: '',
        symbol: '',
        description: '',
        image: null,
        attributes: [],
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
                setNftForm(prev => ({
                    ...prev,
                    image: file
                }));
            }
        } else {
            setNftForm(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (currentStep !== 3) {
            nextStep();
            return;
        }
        try {
            setIsLoading(true);
            // TODO: Implement collection creation logic
            console.log('Creating NFT:', nftForm);
            //  Handle photo upload to Supabase storage
            let photoUrl = "";
            if (nftForm.image) {
                const upload_name = `photo/nft-${Date.now()}-${nftForm.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                const { data: uploadData, error: uploadError } = await Db.storage
                    .from('metaloot')
                    .upload(upload_name, nftForm.image);

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
                name: nftForm.name,
                description: nftForm.description,
                image: photoUrl,
                external_url: "https://metaloot.dev",
                attributes: nftForm.attributes,
                properties: {
                    category: "image",
                    files: [
                        {
                            uri: photoUrl,
                            type: nftForm.image?.type
                        }
                    ]
                }
            };

            const metadataBlob = new Blob([JSON.stringify(metadata)], {
                type: 'application/json'
            });
            let metadata_name = `metadata/nft-${Date.now()}-${nftForm.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
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

            const response = await fetch('https://metaloot-cloud-d4ec.shuttle.app/v1/api/collection/nft', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        name: nftForm.name,
                        symbol: nftForm.symbol,
                        collection_mint: selectedCollection,
                        uri: publicUrl
                    }
                )
            });
            if (!response.ok) {
                throw new Error('Failed to create collection');
            }
            const data = await response.json();
            console.log("data", data)
            const nft_address = data.address;
            const newNft = {
                name: nftForm.name,
                symbol: nftForm.symbol,
                image: photoUrl,
                description: nftForm.description,
                address: nft_address,
                external_link: "https://metaloot.dev",
                owner: auth.userData?.id
            } as NFTData;
            setCollectionNFTs([...collectionNFTs, newNft]);
            console.log("Create NFT Successfully ,", nft_address);
            setShowCreateForm(false);
        } catch (error) {
            console.error('Error creating collection:', error)
        } finally {
            setIsLoading(false);
            setShowCreateForm(false);
        };
    };

    const handleAddAttribute = () => {
        setNftForm(prev => ({
            ...prev,
            attributes: [...prev.attributes, { trait_type: '', value: '' }]
        }));
    };

    const handleAttributeChange = (index: number, field: 'trait_type' | 'value', value: string) => {
        setNftForm(prev => ({
            ...prev,
            attributes: prev.attributes.map((attr, i) =>
                i === index ? { ...attr, [field]: value } : attr
            )
        }));
    };

    const handleRemoveAttribute = (index: number) => {
        setNftForm(prev => ({
            ...prev,
            attributes: prev.attributes.filter((_, i) => i !== index)
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 pt-20">
            <div className="h-screen flex flex-col items-center justify-center relative w-full">
                {isLoading ? (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-12 h-12 border-4 border-white/10 border-t-[#0CC0DF] rounded-full animate-spin"></div>
                        <p className="text-white/60">Creating NFT...</p>
                    </div>
                ) : (
                    <div className="text-center space-y-8 mb-32">
                        {/* Collection Preview Display */}
                        <div className="relative">
                            <div className="w-32 h-32 mx-auto bg-black border border-white/10 rounded-full flex items-center justify-center relative z-10">
                                {nftForm.image ? (
                                    <img
                                        src={URL.createObjectURL(nftForm.image)}
                                        alt="Collection preview"
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    <span className="text-white text-4xl font-bold">
                                        {nftForm.symbol?.[0] || '?'}
                                    </span>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0CC0DF]/20 to-[#14F195]/20 blur-xl rounded-full transform scale-150 -z-0"></div>
                            <div className="mt-4 text-center">
                                <h3 className="text-white text-xl font-bold">
                                    {nftForm.name || 'NFTs Name'}
                                </h3>
                                <p className="text-white/60 text-sm mt-1">
                                    {nftForm.symbol || 'SYMBOL'}
                                </p>
                            </div>
                        </div>

                        {/* Step indicators */}
                        <div className="mt-8 flex justify-center gap-2">
                            {[1, 2, 3].map((step) => (
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
                                        value={nftForm.name}
                                        onChange={handleCollectionChange}
                                        placeholder="NFTs Name"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="symbol"
                                        value={nftForm.symbol}
                                        onChange={handleCollectionChange}
                                        placeholder="NFTs Symbol"
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
                                        value={nftForm.description}
                                        onChange={handleCollectionChange}
                                        placeholder="NFTs Description"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white h-32"
                                        required
                                    />
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-white">Attributes</h3>
                                        <button
                                            type="button"
                                            onClick={handleAddAttribute}
                                            className="px-3 py-1 bg-[#0CC0DF]/20 text-[#0CC0DF] rounded-lg hover:bg-[#0CC0DF]/30"
                                        >
                                            Add Attribute
                                        </button>
                                    </div>
                                    {nftForm.attributes.map((attr, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={attr.trait_type}
                                                onChange={(e) => handleAttributeChange(index, 'trait_type', e.target.value)}
                                                placeholder="Trait Type"
                                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                                            />
                                            <input
                                                type="text"
                                                value={attr.value}
                                                onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                                                placeholder="Value"
                                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveAttribute(index)}
                                                className="px-3 py-1 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
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
                                    {currentStep === 3 ? 'Create NFT' : 'Next'}
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
