import { Db } from '@/app/utils/db';
import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { FaImage } from 'react-icons/fa';
import { AppProvider, GameData, useAppContext } from "@/app/utils/AppContext";
import { circIn } from 'framer-motion';
import { IdeaProps, OfferProps } from '@/app/idea/[id]/components/ideaCard';

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

interface OfferFormData {
    type: string;
    description: string;
    commission: number;
    active: boolean;
    idea_id: number;
    payment_link?: string;
    promotion_code?: string;
}

interface ManageOfferFormProps {
    setShowOfferForm: (show: boolean) => void;
    selectedOffer?: OfferProps;
    onSubmitSuccess?: () => void;
}

const OFFER_TYPES = [
    "Commission",
    "Fixed Price",
    "Equity",
    "Revenue Share"
];

export default function ManageOfferForm({ setShowOfferForm, selectedOffer, onSubmitSuccess }: ManageOfferFormProps) {
    const { auth } = useAppContext();
    const user = auth?.userData;
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [userIdeas, setUserIdeas] = useState<IdeaProps[]>([]);
    const [offerForm, setOfferForm] = useState<OfferFormData>({
        type: selectedOffer?.type || '',
        description: selectedOffer?.description || '',
        commission: selectedOffer?.commission || 0,
        active: selectedOffer?.active || true,
        idea_id: selectedOffer?.ideas_id?.id || 0,
        payment_link: selectedOffer?.payment_link || '',
        promotion_code: selectedOffer?.promotion_code || ''
    });

    useEffect(() => {
        const fetchUserIdeas = async () => {
            try {
                const { data: ideas, error } = await Db
                    .from('ideas')
                    .select('*')
                    .eq('user_id', user?.id);

                if (error) throw error;
                setUserIdeas(ideas || []);
            } catch (error) {
                console.error('Error fetching ideas:', error);
            }
        };

        if (user?.id) {
            fetchUserIdeas();
        }
    }, [user?.id]);

    const handleOfferChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setOfferForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
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

            if (selectedOffer) {
                // Update existing offer
                const { error: offerError } = await Db
                    .from('offers')
                    .update({
                        type: offerForm.type,
                        description: offerForm.description,
                        commission: offerForm.commission,
                        active: offerForm.active,
                        payment_link: offerForm.payment_link,
                        promotion_code: offerForm.promotion_code
                    })
                    .eq('id', selectedOffer.id);

                if (offerError) throw offerError;
            } else {
                // Create new offer
                const { error: offerError } = await Db
                    .from('offers')
                    .insert([{
                        type: offerForm.type,
                        description: offerForm.description,
                        commission: offerForm.commission,
                        active: offerForm.active,
                        idea_id: offerForm.idea_id,
                        user_id: auth?.userData?.id,
                        payment_link: offerForm.payment_link,
                        promotion_code: offerForm.promotion_code
                    }]);

                if (offerError) throw offerError;
            }
            setShowOfferForm(false);
            onSubmitSuccess?.();
        } catch (error) {
            console.error('Error managing offer:', error);
            alert('Failed to manage offer. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 pt-20">
            <div className="h-screen flex flex-col items-center justify-center relative w-full">
                <div className="bg-white rounded-lg p-8 max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-6">
                        {selectedOffer ? 'Edit Offer' : 'Create New Offer'}
                    </h2>

                    {/* Step indicators */}
                    <div className="mt-4 mb-8 flex justify-center gap-2">
                        {[1, 2].map((step) => (
                            <div
                                key={step}
                                className={`w-2 h-2 rounded-full ${currentStep >= step ? 'bg-blue-600' : 'bg-gray-200'}`}
                            />
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {currentStep === 1 ? (
                                <>
                                    <select
                                        name="idea_id"
                                        value={offerForm.idea_id}
                                        onChange={handleOfferChange}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2"
                                        required
                                    >
                                        <option value="">Select Idea</option>
                                        {userIdeas.map((idea) => (
                                            <option key={idea.id} value={idea.id}>{idea.title}</option>
                                        ))}
                                    </select>

                                    <select
                                        name="type"
                                        value={offerForm.type}
                                        onChange={handleOfferChange}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2"
                                        required
                                    >
                                        <option value="">Select Offer Type</option>
                                        {OFFER_TYPES.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>

                                    <textarea
                                        name="description"
                                        value={offerForm.description}
                                        onChange={handleOfferChange}
                                        placeholder="Offer Description"
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 h-32"
                                        required
                                    />
                                </>
                            ) : (
                                <>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="commission"
                                            value={offerForm.commission}
                                            onChange={handleOfferChange}
                                            placeholder="Commission Percentage"
                                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8"
                                            required
                                            min="0"
                                            max="100"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                    </div>

                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            name="active"
                                            checked={offerForm.active}
                                            onChange={handleOfferChange}
                                            className="form-checkbox"
                                        />
                                        <span>Active Offer</span>
                                    </label>

                                    <input
                                        type="url"
                                        name="payment_link"
                                        value={offerForm.payment_link}
                                        onChange={handleOfferChange}
                                        placeholder="Payment Link (optional)"
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2"
                                    />

                                    <input
                                        type="text"
                                        name="promotion_code"
                                        value={offerForm.promotion_code}
                                        onChange={handleOfferChange}
                                        placeholder="Promotion Code (optional)"
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2"
                                    />
                                </>
                            )}

                            <div className="flex gap-4 mt-6">
                                {currentStep > 1 && (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="flex-1 px-6 py-3 border border-gray-200 rounded-lg text-gray-600 hover:border-gray-300"
                                    >
                                        Back
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-medium hover:opacity-90"
                                >
                                    {currentStep === 2 ? (selectedOffer ? 'Update Offer' : 'Create Offer') : 'Next'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={() => setShowOfferForm(false)}
                    className="absolute top-8 right-8 text-gray-600 hover:text-gray-800 text-4xl font-bold"
                >
                    ×
                </button>
            </div>
        </div>
    );
}
