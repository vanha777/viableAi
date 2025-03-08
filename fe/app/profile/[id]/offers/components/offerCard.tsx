'use client'
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Db, Server } from "@/app/utils/db";
import { AppProvider, useAppContext, UserData } from "@/app/utils/AppContext";
import ManageIdeaForm from '@/app/dashboard/components/manageIdeas';
import { IdeaProps } from '../../components/ideaCard';
import ManageOfferForm from './manageOffers';
import { useRouter } from 'next/navigation';
export interface LocationProps {
  id?: number;
  country?: string;
  state?: string;
  suburb?: string;
}

export interface OfferProps {
  id?: number;
  created_at?: string;
  totalDeals?: number;
  active?: boolean;
  commission?: number;
  type?: string;
  description?: string;
  ideas?: IdeaProps;
}

export default function OfferCard() {
  const router = useRouter();
  const { auth, getUser } = useAppContext();
  const [parsedOffers, setParsedOffers] = useState<OfferProps[]>([]);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferProps | undefined>(undefined);

  const fetchOffers = async () => {
    let user = auth.userData;
    if (!user) {
      user = getUser();
      if (!user) {
        router.push('/not-found');
      }
    }
    const { data: offersData, error: offersError } = await Db
      .from('offers')
      .select(`
        *,
        ideas!idea_id (
          *
        )
      `)
      .eq('user_id', user?.id);

    if (offersData) {
      setParsedOffers(offersData as OfferProps[]);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  return (
    <div className="w-full">
      {/* Page Heading with navbar-style bubble */}
      <div className="navbar bg-gray-50 text-black p-6">
        <div className="flex-1">
          <div className="bg-base-200 rounded-full px-8 py-4 shadow-lg flex items-center">
            <div className="text-xl">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text font-bold text-2xl">
                Your Offers
              </span>
              <p className="text-base text-gray-600 mt-2">Manage and view all your business offers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-gray-50">
        {parsedOffers && parsedOffers.length > 0 && parsedOffers.map((offer) => (
          <div
            key={offer.id}
            className="group relative bg-base-200 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer p-6"
            onClick={() => {
              setSelectedOffer(offer);
              setShowOfferForm(true);
            }}
          >
            {/* Commission Circle - Floating Design */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex flex-col items-center justify-center text-white transform rotate-12 group-hover:rotate-0 transition-transform duration-300">
              <div className="text-2xl font-bold -rotate-12 group-hover:rotate-0 transition-transform duration-300">
                {offer.commission}%
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 mb-6">
              <span className={`w-2 h-2 rounded-full ${
                offer.active ? 'bg-green' : 'bg-red'
              } animate-pulse`}></span>
              <span className="text-sm font-medium text-gray-600">
                {offer.active ? 'Active Offer' : 'Inactive Offer'}
              </span>
            </div>

            {/* Main Content */}
            <div className="space-y-4">
              {/* Type Badge */}
              {offer.type && (
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                  offer.type.toLowerCase().includes('exclusive') 
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : offer.type.toLowerCase().includes('premium')
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : offer.type.toLowerCase().includes('basic')
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : offer.type.toLowerCase().includes('partner')
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}>
                  {offer.type}
                </span>
              )}

              {/* Description */}
              <p className="text-gray-600 line-clamp-2 leading-relaxed">
                {offer.description}
              </p>

              {/* Stats Row */}
              <div className="flex items-center gap-4 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">{offer.totalDeals || 0} deals</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Date(offer.created_at || '').toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Related Idea - Minimal Design */}
              {offer.ideas && (
                <div className="relative mt-4 p-4 bg-transparent rounded-2xl overflow-hidden group-hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    {offer.ideas.media && offer.ideas.media[0] && (
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                        <Image
                          src={offer.ideas.media[0]}
                          alt={offer.ideas.title || 'Idea image'}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {offer.ideas.title}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {offer.ideas.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add New Offer Card */}
        <div
          onClick={() => setShowOfferForm(true)}
          className="card bg-base-200 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border-dashed border-2 border-gray-300 cursor-pointer flex items-center justify-center min-h-[300px]"
        >
          <div className="text-center p-6">
            <div className="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-600">Create New Offer</h3>
          </div>
        </div>
      </div>

      {/* Form Overlay */}
      {showOfferForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <ManageOfferForm
              setShowOfferForm={(show) => {
                setShowOfferForm(show);
                if (!show) {
                  setSelectedOffer(undefined);
                }
              }}
              selectedOffer={selectedOffer}
              onSubmitSuccess={fetchOffers}
            />
          </div>
        </div>
      )}
    </div>
  );
}