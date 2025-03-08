'use client'
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Db, Server } from "@/app/utils/db";
import { AppProvider, useAppContext, UserData } from "@/app/utils/AppContext";
import { redirect } from 'next/navigation';
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
  ideas?: IdeaProps;
  payment_link?: string;
  promotion_code?: string;
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
  const { auth, setUser, getUser } = useAppContext();
  const [parsedIdea, setParsedIdea] = useState<IdeaProps | null>(null);
  useEffect(() => {
    const fetchIdeas = async () => {
      let user = auth.userData;
      if (!user) {
        user = getUser();
        console.log("welcome back", user);
      }
      // fetch idea from supabase with related data
      const { data: ideaData, error: ideaError } = await Db
        .from('ideas')
        .select(`*,address_detail!inner (*)`)
        .eq('user_id', user?.id)
        .limit(1).single();

      if (!ideaData || ideaData.length === 0) {
        console.log("ideaData not found");
        redirect('/not-found');
      }
      let parsedIdeaData = JSON.parse(JSON.stringify(ideaData)) as IdeaProps;
      const { data: offersData, error: offerError } = await Db
        .from('offers')
        .select(`*`)
        .eq('idea_id', parsedIdeaData.id)
        .limit(1).single();

      if (offersData) {
        parsedIdeaData.offer = JSON.parse(JSON.stringify(offersData)) as OfferProps;
      }
      console.log("parsedIdea", parsedIdeaData);
      setParsedIdea(parsedIdeaData);
    }
    fetchIdeas();
  }, []);
  // const user = getUser();
  // console.log("user", user);
  // const [idea, setIdea] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Add new state for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [upvotes, setUpvotes] = useState(parsedIdea?.upvotes || 0);
  const [downvotes, setDownvotes] = useState(parsedIdea?.downvotes || 0);

  // Add handler for opening modal
  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!auth.userData) {
      console.log('User must be logged in to vote');
      return;
    }

    console.log('voteType', voteType);
    try {
      // Update the local state optimistically
      if (voteType === 'up') {
        setUpvotes(prev => prev + 1);
      } else {
        setDownvotes(prev => prev - 1);
      }

      // Update the database
      const { error } = await Db
        .from('ideas')
        .update({
          [voteType === 'up' ? 'upvotes' : 'downvotes']: voteType === 'up' ? upvotes + 1 : downvotes + 1
        })
        .eq('id', parsedIdea?.id);

      if (error) {
        // Revert the local state if there's an error
        if (voteType === 'up') {
          setUpvotes(prev => prev - 1);
        } else {
          setDownvotes(prev => prev - 1);
        }
        console.error('Error updating votes:', error);
      }
    } catch (error) {
      console.error('Error handling vote:', error);
      // Revert the local state
      if (voteType === 'up') {
        setUpvotes(prev => prev - 1);
      } else {
        setDownvotes(prev => prev - 1);
      }
    }
  };

  return (
    <div className="w-full px-48">
      {/* Carousel Section */}
      {parsedIdea?.media && parsedIdea?.media.length > 0 && (
        <div className="relative w-full h-[400px] mb-4 grid grid-cols-4 gap-2 rounded-xl overflow-hidden">
          {/* Main large image */}
          <div className="col-span-2 row-span-2 relative h-full">
            <img
              src={parsedIdea?.media[0]}
              alt="Main image"
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => handleImageClick(0)}
            />
          </div>

          {/* Secondary images */}
          <div className="col-span-2 grid grid-cols-2 gap-2 h-full">
            {parsedIdea?.media.slice(1, 5).map((image, index) => (
              <div key={index} className="relative h-[196px]">
                <img
                  src={image}
                  alt={`Image ${index + 2}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => handleImageClick(index + 1)}
                />
              </div>
            ))}
          </div>

          {/* Show all photos button */}
          <button
            className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg 
                       text-sm font-medium shadow-md hover:scale-105 transition-transform"
            onClick={() => setIsModalOpen(true)}
          >
            Show all photos
          </button>
        </div>
      )}

      {/* Image Modal */}
      {isModalOpen && parsedIdea?.media && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
          <div className="relative w-full max-w-6xl mx-auto">
            {/* Close button */}
            <button
              className="absolute top-4 right-4 z-10 text-white bg-black/50 p-2 rounded-full hover:bg-black/75"
              onClick={() => setIsModalOpen(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Main image */}
            <div className="relative aspect-video">
              <img
                src={parsedIdea?.media[currentImageIndex]}
                alt={`Image ${currentImageIndex + 1}`}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Navigation buttons */}
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 p-2 rounded-full hover:bg-black/75"
              onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? parsedIdea?.media!.length - 1 : prev - 1))}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 p-2 rounded-full hover:bg-black/75"
              onClick={() => setCurrentImageIndex((prev) => (prev === parsedIdea?.media!.length - 1 ? 0 : prev + 1))}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-full">
              {currentImageIndex + 1} / {parsedIdea?.media!.length}
            </div>
          </div>
        </div>
      )}

      {/* Split Content */}
      <div className="flex gap-4">
        {/* Left Section - Redesigned */}
        <div className="flex-1 p-0 border border-gray-200 rounded-2xl shadow-lg overflow-hidden bg-white">
          {/* Header with Title and Industry */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  {parsedIdea?.title}
                </h2>
                {parsedIdea?.url && (
                  <a href={parsedIdea?.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-gray-600 bg-white/80 px-3 py-1 rounded-full">
                    <span className="mr-1">🔗</span> {parsedIdea?.url}
                  </a>
                )}
                <div className="flex gap-3 mt-2">
                  {parsedIdea?.address_detail && (
                    <span className="inline-flex items-center text-sm text-gray-600 bg-white/80 px-3 py-1 rounded-full">
                      <span className="mr-1">📍</span> {parsedIdea?.address_detail.country}{parsedIdea?.address_detail.state ? `, ${parsedIdea?.address_detail.state}` : ''}{parsedIdea?.address_detail.suburb ? `, ${parsedIdea?.address_detail.suburb}` : ''}
                    </span>
                  )}
                  {parsedIdea?.industry && (
                    <span className="inline-flex items-center text-sm text-gray-600 bg-white/80 px-3 py-1 rounded-full">
                      <span className="mr-1">🏢</span> {parsedIdea?.industry}
                    </span>
                  )}
                </div>
              </div>

              {/* Voting System */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleVote('up')}
                  className={`flex items-center gap-1 ${!auth.userData ? 'opacity-50 cursor-not-allowed' : 'bg-white hover:bg-gray-50'} px-4 py-2 rounded-xl transition-colors`}
                  disabled={!auth.userData}
                >
                  <span>⬆️</span>
                  <span className="font-medium">{upvotes}</span>
                </button>
                <button
                  onClick={() => handleVote('down')}
                  className={`flex items-center gap-1 ${!auth.userData ? 'opacity-50 cursor-not-allowed' : 'bg-white hover:bg-gray-50'} px-4 py-2 rounded-xl transition-colors`}
                  disabled={!auth.userData}
                >
                  <span>⬇️</span>
                  <span className="font-medium">{downvotes}</span>
                </button>
                {/* X (formerly Twitter) Share Button */}
                <button
                  onClick={() => {
                    const text = `Check out this cool idea from CoLaunch.It: ${parsedIdea?.title}`;
                    const url = window.location.href;
                    window.open(
                      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
                      '_blank'
                    );
                  }}
                  className="flex items-center gap-1 bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Share
                </button>
                {/* LinkedIn Share Button */}
                <button
                  onClick={() => {
                    const url = window.location.href;
                    window.open(
                      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
                      '_blank'
                    );
                  }}
                  className="flex items-center gap-1 bg-[#0A66C2] text-white px-4 py-2 rounded-xl hover:bg-[#004182] transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="p-6">
            <div className="prose prose-lg">
              <p className="text-gray-700 leading-relaxed">
                {parsedIdea?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Section - Redesigned */}
        <div className="w-1/3 flex flex-col p-0 border border-gray-200 rounded-2xl shadow-lg overflow-hidden bg-white">
          {/* Card Header with Metadata */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
            <h3 className="text-xl font-bold text-gray-800">Deal Information</h3>
            {parsedIdea?.offer ? (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {parsedIdea?.offer.created_at && (
                  <span className="px-2 py-1 bg-white/80 rounded-full text-gray-600">
                    📅 {parsedIdea?.offer.created_at}
                  </span>
                )}
                {parsedIdea?.offer.active !== undefined && (
                  <span className={`px-2 py-1 rounded-full ${parsedIdea?.offer.active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                    }`}>
                    ⭐ {parsedIdea?.offer.active ? 'Active' : 'Inactive'}
                  </span>
                )}
                {parsedIdea?.offer.type && (
                  <span className="px-2 py-1 bg-white/80 rounded-full text-gray-600">
                    📋 {parsedIdea?.offer.type}
                  </span>
                )}
                {parsedIdea?.offer.totalDeals && (
                  <span className="px-2 py-1 bg-white/80 rounded-full text-gray-600">
                    🤝 {parsedIdea?.offer.totalDeals} deals
                  </span>
                )}
              </div>
            ) : (
              <div className="mt-3 text-gray-600">
                No deals available at the moment
              </div>
            )}
          </div>

          {/* Card Body */}
          <div className="flex-1 p-6 space-y-6">
            {parsedIdea?.offer ? (
              <>
                {/* Commission - Highlighted */}
                {parsedIdea?.offer.comission && (
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {parsedIdea?.offer.comission}%
                    </div>
                    <div className="text-sm text-blue-600">Commission Rate</div>
                  </div>
                )}

                {/* Description - Prominent */}
                {parsedIdea?.offer.description && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                      Deal Details
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {parsedIdea?.offer.description}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500">
                Check back later for new deals
              </div>
            )}
          </div>

          {/* Card Action */}
          <div className="p-6 bg-gray-50">
            <button
              className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl transition-all duration-200 font-medium shadow-sm ${!auth.userData || !parsedIdea?.offer
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:opacity-90 hover:shadow-blue-200 hover:shadow-lg active:transform active:scale-98'
                }`}
              disabled={!auth.userData || !parsedIdea?.offer}
            >
              {parsedIdea?.offer ? 'Make Deal' : 'No Deals Available'}
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">
              {!auth.userData
                ? "Please login to make deals."
                : parsedIdea?.offer
                  ? "By making a deal, you agree to our terms and conditions. Commission rates are subject to change."
                  : "No deals are currently available for this idea."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}