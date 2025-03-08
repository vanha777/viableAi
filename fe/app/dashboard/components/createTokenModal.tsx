import { useState, FormEvent, ChangeEvent } from 'react';
import SimpleLoading from './simpleLoading';
import { AppProvider, GameData, useAppContext } from "@/app/utils/AppContext";
import { Db } from '@/app/utils/db'
interface CreateTokenModalProps {
    selectedGame: GameData;
    setShowCreateForm: (show: boolean) => void;
}

interface FormData {
    name: string;
    symbol: string;
    description: string;
    photo: File | null;
}

export default function CreateTokenModal({ setShowCreateForm, selectedGame }: CreateTokenModalProps) {
    const { auth, setTokenData } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        symbol: '',
        description: '',
        photo: null,
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
                setFormData(prev => ({
                    ...prev,
                    [name]: file
                }));
            }
        } else {
            setFormData(prev => ({
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
        } else {
            setIsLoading(true)
            console.log("submitting", formData)
            try {
                if (auth.tokenData != null) {
                    console.log("update exsiting tokens")
                    // edit token metadatajson
                    let token_uri = auth.tokenData.uri;
                    // overwrite photo to supabase storage
                    let photoUrl = "";
                    if (formData.photo) {
                        // Extract just the path portion, not the full URL
                        const photoPath = auth.tokenData?.image?.replace(
                            'https://tzqzzuafkobkhygtccse.supabase.co/storage/v1/object/public/metaloot/',
                            ''
                        );
                        const { data: uploadData, error: uploadError } = await Db.storage
                            .from('metaloot')
                            .update(photoPath ?? '', formData.photo, {
                                upsert: true
                            });
                        if (uploadError) {
                            console.error('Error uploading photo:', uploadError);
                            return;
                        }
                        // Get public URL for the uploaded photo
                        const { data: { publicUrl } } = Db.storage
                            .from('metaloot')
                            .getPublicUrl(uploadData.path);
                        photoUrl = publicUrl;
                        console.log("uploadedData", publicUrl);
                    }
                    // overwrite token metadata
                    const metadata = {
                        name: formData.name,
                        symbol: formData.symbol,
                        description: formData.description,
                        image: photoUrl,
                        attributes: [],
                        properties: {
                            category: "token",
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
                    const old_path = auth.tokenData?.uri?.replace(
                        'https://tzqzzuafkobkhygtccse.supabase.co/storage/v1/object/public/metaloot/',
                        ''
                    );
                    console.log("old_path", old_path)
                    const { data: newUploadData, error: newUploadError } = await Db.storage
                        .from('metaloot')
                        .update(old_path ?? '', metadataBlob, {
                            upsert: true
                        });
                    if (newUploadError) {
                        console.error('Error uploading photo:', newUploadError);
                        return;
                    }
                    console.log("Update token Successfully", newUploadData.path);

                    setTokenData({
                        name: formData.name,
                        symbol: formData.symbol,
                        uri: auth.tokenData?.uri,
                        image: photoUrl,
                        description: formData.description,
                        address: auth.tokenData?.address,
                    });
                } else {
                    console.log("create new token")
                    //  Handle photo upload to Supabase storage
                    let photoUrl = "";
                    if (formData.photo) {
                        const upload_name = `photo/token-${Date.now()}-${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
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
                        attributes: [],
                        properties: {
                            category: "token",
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
                    const metadata_name = `metadata/token-${Date.now()}-${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
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

                    const response = await fetch('https://metaloot-cloud-d4ec.shuttle.app/v1/api/token/create', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${auth.accessToken}`
                        },
                        body: JSON.stringify(
                            {
                                game_id: selectedGame.id,
                                metadata: {
                                    name: formData.name,
                                    symbol: formData.symbol,
                                    uri: publicUrl
                                }
                            }
                        )
                    });


                    if (!response.ok) {
                        throw new Error('Failed to create game');
                    }

                    const data = await response.json();
                    let token_address = data.address;

                    // //update game_registries table
                    // const { data: gameRegistryData, error: gameRegistryError } = await Db.from('tokens').insert({
                    //     game_id: selectedGame.id,
                    //     token_uri: publicUrl,
                    //     address: token_address,
                    // });
                    // console.log("gameRegistryData", gameRegistryData)

                    setTokenData({
                        name: formData.name,
                        symbol: formData.symbol,
                        uri: publicUrl,
                        image: photoUrl,
                        description: formData.description,
                        address: token_address,
                    });
                    console.log("Create token Successfully");
                }
            } catch (error) {
                console.error('Error handling photo upload:', error);
                setIsLoading(false)
                setShowCreateForm(false)
                return;
            }
            setIsLoading(false)
            setShowCreateForm(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 pt-20">
            {isLoading ? (
                <SimpleLoading />
            ) : (
                <div className="h-screen flex flex-col items-center justify-center relative w-full">
                    <div className="text-center space-y-8 mb-32">
                        {/* Token Preview Display */}
                        <div className="relative">
                            <div className="w-32 h-32 mx-auto bg-black border border-white/10 rounded-full 
                            flex items-center justify-center relative z-10">
                                {formData.photo ? (
                                    <img
                                        src={URL.createObjectURL(formData.photo)}
                                        alt="Token preview"
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    <span className="text-white text-4xl font-bold">
                                        {formData.symbol?.[0] || '?'}
                                    </span>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0CC0DF]/20 to-[#14F195]/20 
                            blur-xl rounded-full transform scale-150 -z-0"></div>
                            <div className="mt-4 text-center">
                                <h3 className="text-white text-xl font-bold">
                                    {formData.name || 'Token Name'}
                                </h3>
                                <p className="text-white/60 text-sm mt-1">
                                    {formData.symbol || 'SYMBOL'}
                                </p>
                            </div>
                        </div>

                        {/* Step indicators */}
                        <div className="mt-8 flex justify-center gap-2">
                            {[1, 2].map((step) => (
                                <div
                                    key={step}
                                    className={`w-2 h-2 rounded-full ${currentStep >= step ? 'bg-[#0CC0DF]' : 'bg-white/10'
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
                                        onChange={handleChange}
                                        placeholder="Token Name"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="symbol"
                                        value={formData.symbol}
                                        onChange={handleChange}
                                        placeholder="Token Symbol"
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
                                        onChange={handleChange}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                                        required
                                    />
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Token Description"
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
                                    {currentStep === 2
                                        ? (auth.tokenData ? 'Edit Token' : 'Create Token')
                                        : 'Next'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={() => setShowCreateForm(false)}
                        className="absolute top-8 right-8 text-white/60 hover:text-white text-4xl font-bold"
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
}
