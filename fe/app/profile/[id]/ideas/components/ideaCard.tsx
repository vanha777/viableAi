'use client'
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Db, Server } from "@/app/utils/db";
import { AppProvider, useAppContext, UserData } from "@/app/utils/AppContext";
import ManageIdeaForm from '@/app/dashboard/components/manageIdeas';
import router from 'next/router';
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
  comission?: number;
  type?: string;
  description?: string;
}

export interface IdeaProps {
  id?: number;
  title: string;
  description: string;
  date?: string;
  address_detail?: LocationProps;
  industry?: string;
  media?: string[];
  upvotes?: number;
  downvotes?: number;
  url?: string;
  offer?: OfferProps;
}

export default function IdeaCard() {
  const { auth, getUser } = useAppContext();
  const [parsedIdeas, setParsedIdeas] = useState<IdeaProps[]>([]);
  const [showIdeaForm, setShowIdeaForm] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<IdeaProps | undefined>(undefined);

  useEffect(() => {
    const fetchIdeas = async () => {
      let user = auth.userData;
      if (!user) {
        user = getUser();
        console.log("welcome back", user);
        if (!user) {
          router.push('/not-found');
        }
      }
      // Fetch all ideas from supabase with related data
      const { data: ideasData, error: ideasError } = await Db
        .from('ideas')
        .select(`*,address_detail!inner (*)`)
        .eq('user_id', user?.id);

      if (!ideasData || ideasData.length === 0) {
        console.log("ideasData not found");
        return;
      }

      // Fetch offers for all ideas
      const parsedIdeasData = await Promise.all(ideasData.map(async (ideaData) => {
        let parsedIdeaData = JSON.parse(JSON.stringify(ideaData)) as IdeaProps;

        const { data: offersData, error: offerError } = await Db
          .from('offers')
          .select(`*`)
          .eq('idea_id', parsedIdeaData.id)
          .limit(1).single();

        if (offersData) {
          parsedIdeaData.offer = JSON.parse(JSON.stringify(offersData)) as OfferProps;
        }
        return parsedIdeaData;
      }));

      console.log("parsedIdeas", parsedIdeasData);
      setParsedIdeas(parsedIdeasData);
    }
    fetchIdeas();
  }, []);

  return (
    <div className="w-full">
      {/* Page Heading with navbar-style bubble */}
      <div className="navbar bg-gray-50 text-black p-6">
        <div className="flex-1">
          <div className="bg-base-200 rounded-full px-8 py-4 shadow-lg flex items-center">
            <div className="text-xl">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text font-bold text-2xl">
                Your Products
              </span>
              <p className="text-base text-gray-600 mt-2">Manage and view all your business products</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-gray-50">
        {/* Existing Idea Cards */}
        {parsedIdeas.map((idea) => (
          <div
            key={idea.id}
            className="card bg-base-200 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            onClick={() => {
              setSelectedIdea(idea);
              setShowIdeaForm(true);
            }}
          >
            {/* Image Section */}
            {idea.media && idea.media.length > 0 && (
              <figure className="relative">
                <img
                  src={idea.media[0]}
                  alt={idea.title}
                  className="w-full h-52 object-cover"
                />
              </figure>
            )}

            {/* Content Section */}
            <div className="card-body p-5">
              <div className="flex justify-between items-start">
                <h2 className="card-title text-gray-800 font-semibold">{idea.title}</h2>
                <div className="flex gap-3 text-sm font-medium">
                  <span className="flex items-center text-emerald-600">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                    {idea.upvotes || 0}
                  </span>
                  <span className="flex items-center text-rose-600">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 8.707l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L9 10.586V7a1 1 0 112 0v3.586l1.293-1.293a1 1 0 011.414 1.414z" clipRule="evenodd" />
                    </svg>
                    {idea.downvotes || 0}
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-3">
                {/* Location and Industry Tags */}
                <div className="flex flex-wrap gap-2">
                  {idea.industry && (
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                      {idea.industry}
                    </span>
                  )}
                  {idea.address_detail && (
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {idea.address_detail.suburb && `${idea.address_detail.suburb}, `}
                      {idea.address_detail.state && `${idea.address_detail.state}, `}
                      {idea.address_detail.country}
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-600 line-clamp-2">{idea.description}</p>

                {/* Offer Status */}
                {idea.offer && (
                  <div className="pt-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${idea.offer.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                      {idea.offer.active ? 'Active Deal' : 'Inactive Deal'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {/* Add New Idea Card */}
        <div
          onClick={() => setShowIdeaForm(true)}
          className="card bg-base-200 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border-dashed border-2 border-gray-300 cursor-pointer flex items-center justify-center min-h-[300px]"
        >
          <div className="text-center">
            <div className="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-600">Add new Product</h3>
          </div>
        </div>
      </div>

      {/* Form Overlay */}
      {showIdeaForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <ManageIdeaForm
              setShowCreateForm={(show) => {
                setShowIdeaForm(show);
                if (!show) {
                  setSelectedIdea(undefined);
                }
              }}
              selectedIdea={selectedIdea}
            />
          </div>
        </div>
      )}
    </div>
  );
}