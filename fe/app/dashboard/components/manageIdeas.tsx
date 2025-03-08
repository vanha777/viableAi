import { Db } from '@/app/utils/db';
import { useState, FormEvent, ChangeEvent } from 'react';
import { FaImage } from 'react-icons/fa';
import { AppProvider, GameData, useAppContext } from "@/app/utils/AppContext";
import { circIn } from 'framer-motion';
import { IdeaProps } from '@/app/idea/[id]/components/ideaCard';

interface CollectionFormData {
    title: string;
    industry: string;
    description: string;
    country: string;
    city: string;
    state: string;
    images: File[];
    url?: string;
}

interface CreateCollectionFormProps {
    setShowCreateForm: (show: boolean) => void;
    selectedIdea?: IdeaProps;
}

const INDUSTRY_OPTIONS = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "Entertainment",
    "Retail",
    "Manufacturing",
    "Transportation",
    "Energy",
    "Real Estate"
];

export default function ManageIdeaForm({ setShowCreateForm, selectedIdea }: CreateCollectionFormProps) {
    const { auth, setTokenData, setCollectionData } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [collectionForm, setCollectionForm] = useState<CollectionFormData>({
        title: selectedIdea?.title || '',
        industry: selectedIdea?.industry || '',
        description: selectedIdea?.description || '',
        country: selectedIdea?.address_detail?.country || '',
        city: selectedIdea?.address_detail?.suburb || '',
        state: selectedIdea?.address_detail?.state || '',
        images: [],
        url: selectedIdea?.url || '',
    });
    // Add this new state to track all displayed images (both existing and new)
    const [displayImages, setDisplayImages] = useState<Array<string | File>>(() => {
        return selectedIdea?.media || [];
    });

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newFile = files[0];
        if (newFile.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            e.target.value = '';
            return;
        }

        if (displayImages.length >= 5) {
            alert('Maximum 5 images allowed');
            return;
        }

        setDisplayImages(prev => [...prev, newFile]);
        setCollectionForm(prev => ({
            ...prev,
            images: [...prev.images, newFile]
        }));
    };

    const removeImage = (index: number) => {
        setDisplayImages(prev => prev.filter((_, i) => i !== index));
        // Only remove from collectionForm.images if it's a new image
        if (index >= (selectedIdea?.media?.length || 0)) {
            const newImageIndex = index - (selectedIdea?.media?.length || 0);
            setCollectionForm(prev => ({
                ...prev,
                images: prev.images.filter((_, i) => i !== newImageIndex)
            }));
        }
    };

    // Helper function to get image URL
    const getImageUrl = (image: string | File): string => {
        return image instanceof File ? URL.createObjectURL(image) : image;
    };

    const handleCollectionChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
                    images: [...prev.images, file]
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
            console.log("these are images : ", collectionForm.images);
            console.log("these are display images : ", displayImages);
            setIsLoading(true);

            let photoUrls: string[] = [];
            let removeImages: string[] = [];
            let canvasImages = displayImages;

            for (const image of canvasImages) {
                if (image instanceof File) {
                    const upload_name = `${crypto.randomUUID()}`;
                    const { data: uploadData, error: uploadError } = await Db.storage
                        .from('idea_media')
                        .upload(upload_name, image);
                    if (uploadError) {
                        console.error('Error uploading photo:', uploadError);
                        continue;
                    }
                    const { data: { publicUrl } } = Db.storage
                        .from('idea_media')
                        .getPublicUrl(uploadData.path);
                    
                    // Replace the File instance with the publicUrl in canvasImages
                    const imageIndex = canvasImages.indexOf(image);
                    if (imageIndex !== -1) {
                        canvasImages[imageIndex] = publicUrl;
                    }
                }
                //TODO
                // then also check if image in selectedIdea?.media has been removed from canvasImages
                // then remove it from database
            }; // Changed semicolon to just period since this is the end of a for loop

            // // also remove old images
            // // Todo: remove old images
            // if (removeImages.length > 0) {
            //     const { error: deleteError } = await Db.storage
            //         .from('idea_media')
            //         .remove(removeImages.map(imgUrl => imgUrl?.split('/').pop()).filter((name): name is string => name !== undefined)); // Extract file names and filter out undefined
            //     if (deleteError) {
            //         console.error('Error deleting images:', deleteError);
            //     }
            // }
            //end.

            if (selectedIdea) {
                // Update existing idea
                const { error: ideaError } = await Db
                    .from('ideas')
                    .update({
                        title: collectionForm.title,
                        industry: collectionForm.industry,
                        description: collectionForm.description,
                        media: photoUrls,
                        url: collectionForm.url
                    })
                    .eq('id', selectedIdea.id);

                const { error: addressError } = await Db
                    .from('address_detail')
                    .update({
                        country: collectionForm.country,
                        suburb: collectionForm.city,
                        state: collectionForm.state,
                    })
                    .eq('id', selectedIdea.address_detail?.id);

                if (ideaError || addressError) throw ideaError || addressError;
            } else {
                // Create new idea (existing code)
                const { data: addressData, error: addressError } = await Db
                    .from('address_detail')
                    .insert([{
                        country: collectionForm.country,
                        suburb: collectionForm.city,
                        state: collectionForm.state,
                    }])
                    .select()
                    .single();

                if (addressError) throw addressError;

                const { data: ideaData, error: ideaError } = await Db
                    .from('ideas')
                    .insert([{
                        title: collectionForm.title,
                        industry: collectionForm.industry,
                        description: collectionForm.description,
                        address_id: addressData.id,
                        upvotes: 0,
                        downvotes: 0,
                        media: photoUrls,
                        user_id: auth?.userData?.id,
                        url: collectionForm.url
                    }])
                    .select()
                    .single();

                if (ideaError) throw ideaError;
            }
            setShowCreateForm(false);
        } catch (error) {
            console.error('Error creating collection:', error);
            alert('Failed to create idea. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 pt-20">
            <div className="h-screen flex flex-col items-center justify-center relative w-full">
                {isLoading ? (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="text-gray-600">Creating collection...</p>
                    </div>
                ) : (
                    <div className="text-center space-y-8 mb-32 w-full max-w-[800px]">
                        {/* Image Grid Preview */}
                        <div className="w-full max-w-[800px] mx-auto">
                            <div className="grid grid-cols-4 gap-2">
                                {/* Main large image slot */}
                                <div className="col-span-2 row-span-2 relative h-[400px]">
                                    {displayImages.length > 0 ? (
                                        <div className="relative w-full h-full">
                                            <img
                                                src={getImageUrl(displayImages[0])}
                                                alt="Main preview"
                                                className="w-full h-full object-cover rounded-xl"
                                            />
                                            <button
                                                onClick={() => removeImage(0)}
                                                className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                            <div className="text-center">
                                                <FaImage className="w-8 h-8 mx-auto text-gray-400" />
                                                <span className="mt-2 block text-sm text-gray-500">Add main image</span>
                                            </div>
                                        </label>
                                    )}
                                </div>

                                {/* Secondary image slots */}
                                <div className="col-span-2 grid grid-cols-2 gap-2">
                                    {[1, 2, 3, 4].map((index) => (
                                        <div key={index} className="relative h-[196px]">
                                            {displayImages[index] ? (
                                                <div className="relative w-full h-full">
                                                    <img
                                                        src={getImageUrl(displayImages[index])}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-full object-cover rounded-xl"
                                                    />
                                                    <button
                                                        onClick={() => removeImage(index)}
                                                        className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                        className="hidden"
                                                    />
                                                    <div className="text-center">
                                                        <FaImage className="w-6 h-6 mx-auto text-gray-400" />
                                                        <span className="mt-1 block text-xs text-gray-500">Add image</span>
                                                    </div>
                                                </label>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Step indicators */}
                        <div className="mt-8 flex justify-center gap-2">
                            {[1, 2].map((step) => (
                                <div
                                    key={step}
                                    className={`w-2 h-2 rounded-full ${currentStep >= step ? 'bg-blue-600' : 'bg-gray-200'}`}
                                />
                            ))}
                        </div>

                        {/* Form Content */}
                        <form onSubmit={handleSubmit} className="mt-8 w-[480px] mx-auto">
                            {currentStep === 1 && (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        name="title"
                                        value={collectionForm.title}
                                        onChange={handleCollectionChange}
                                        placeholder="Product Title"
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800"
                                        required
                                    />
                                    <select
                                        name="industry"
                                        value={collectionForm.industry}
                                        onChange={handleCollectionChange}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800"
                                        required
                                    >
                                        <option value="">Select Industry</option>
                                        {INDUSTRY_OPTIONS.map((industry) => (
                                            <option key={industry} value={industry}>
                                                {industry}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="url"
                                        name="url"
                                        value={collectionForm.url}
                                        onChange={handleCollectionChange}
                                        placeholder="Product URL (optional)"
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800"
                                    />
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-4">
                                    <textarea
                                        name="description"
                                        value={collectionForm.description}
                                        onChange={handleCollectionChange}
                                        placeholder="Product Description"
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800 h-32"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="country"
                                        value={collectionForm.country}
                                        onChange={handleCollectionChange}
                                        placeholder="Product Country"
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="city"
                                        value={collectionForm.city}
                                        onChange={handleCollectionChange}
                                        placeholder="Product City"
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="state"
                                        value={collectionForm.state}
                                        onChange={handleCollectionChange}
                                        placeholder="Product State"
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800"
                                        required
                                    />
                                </div>
                            )}

                            <div className="flex gap-4 mt-6">
                                {currentStep > 1 && (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="flex-1 px-6 py-3 border border-gray-200 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-300 transition-all duration-300"
                                    >
                                        Back
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
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
                    className="absolute top-8 right-8 text-gray-600 hover:text-gray-800 text-4xl font-bold"
                >
                    ×
                </button>
            </div>
        </div>
    );
}
