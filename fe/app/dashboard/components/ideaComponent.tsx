'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LocationProps } from '@/app/idea/[id]/components/ideaCard';
import { IoSearch, IoLocationOutline, IoMic } from "react-icons/io5";
import ChatInstruction from './chatInstruction';
import { Db } from '@/app/utils/db';

export interface Idea {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  media: string[] | [];
  upvotes: number;
  downvotes: number;
  address_id: string;
  address_detail: LocationProps;
  industry: string;
  create_at: string;
  verified?: string;
  tags: string[];
  // Add more properties as needed
}

interface IdeaComponentProps {
  industries: {
    id: string;
    label: string;
    icon: React.ElementType;
    selectedIcon: React.ElementType;
  }[];
}

const IdeaComponent: React.FC<IdeaComponentProps> = ({ industries }) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [isListening, setIsListening] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [showSearchBar, setShowSearchBar] = useState(false);


  useEffect(() => {
    try {
      setIsLoading(true);
      const fetchIdeas = async () => {
        const { data: ideasData, error: ideasError } = await Db
          .from('ideas')
          .select(`
                  *,
                  address_detail!inner (*)
                `).order('upvotes', { ascending: false }); // Sorting by upvotes descending
        console.log("ideasData", ideasData);
        const ideas = ideasData as Idea[];
        setIdeas(ideas);
      }
      fetchIdeas();
    } catch (error) {
      setIsLoading(false);
      console.error('Error fetching ideas:', error);
    } finally {
      setIsLoading(false);
    }

    // fetch token data for selected game
  }, []);

  // Get unique locations from ideas
  const uniqueLocations = ["All Locations", ...new Set(ideas.map(idea =>
    `${idea.address_detail.state}, ${idea.address_detail.country}`
  ))].sort();

  const toggleIndustry = (industryId: string) => {
    setSelectedIndustries(prev =>
      prev.includes(industryId)
        ? prev.filter(i => i !== industryId)
        : [...prev, industryId]
    );
  };

  const handleCardClick = (ideaId: string) => {
    router.push(`/idea/${ideaId}`);
  };

  // Updated search method to handle structured search parameters
  const handleSearchFromChat = async (searchParam: { type: string, value: string, embedding?: number[] }) => {
    const embedding = searchParam.embedding;
    if (!embedding) {
      console.error("No embedding provided");
      return;
    }
    console.log("Embedding:", embedding);
    console.log('Embedding Length:', embedding.length); // Should be 1536
    // Perform vector search if embedding exists
    const { data, error } = await Db.rpc('vector_search_ideas', {
      query_embedding: embedding,
      similarity_threshold: 0.32,
      match_count: 10
    });
    console.log("Vector Search Data:", data);
    const ideas = data as Idea[];
    if (ideas && ideas.length > 0) {
      setIdeas(ideas);
      setShowSearchBar(false);
    } else {
      setShowSearchBar(true);
    }
    if (error) {
      console.error("Vector Search Error:", error);
    }

    // if (!searchParam || !searchParam.type || !searchParam.value) {
    //   setShowSearchBar(true);
    //   return;
    // }

    // setShowSearchBar(false);

    // switch (searchParam.type.toLowerCase()) {
    //   case "name":
    //     setSearchQuery(searchParam.value);
    //     setSearchQuery("");
    //     setSelectedIndustries([]);
    //     break;

    //   case "location":
    //     // Find closest location match
    //     const locationValue = searchParam.value.toLowerCase();
    //     const matchedLocation = uniqueLocations.find(loc => 
    //       loc.toLowerCase() === locationValue || loc.toLowerCase().includes(locationValue)
    //     );

    //     if (matchedLocation) {
    //       setSelectedLocation(matchedLocation);
    //       setSearchQuery("");
    //       setSelectedIndustries([]);
    //     }
    //     break;

    //   case "category":
    //     // Find closest industry/category match
    //     const categoryValue = searchParam.value.toLowerCase();
    //     const matchedIndustry = industries.find(ind => 
    //       ind.label.toLowerCase() === categoryValue || 
    //       ind.label.toLowerCase().includes(categoryValue)
    //     );

    //     if (matchedIndustry) {
    //       // Set new selection instead of adding to existing selection
    //       setSelectedLocation("All Locations");
    //       setSearchQuery("");
    //       setSelectedIndustries([matchedIndustry.id]);
    //     }
    //     break;

    //   default:
    //     // Default to searching by name if type is not recognized
    //     setSearchQuery(searchParam.value);
    // }
  };

  // Update the filteredIdeas logic to support partial location matching
  const filteredIdeas = ideas.filter(idea => {
    const ideaLocation = `${idea.address_detail.state}, ${idea.address_detail.country}`;

    // Search by title
    const matchesSearch = searchQuery === "" ||
      idea.title.toLowerCase().includes(searchQuery.toLowerCase());

    // Location matching - will match state or country independently
    const matchesLocation = selectedLocation === "All Locations" ||
      ideaLocation === selectedLocation ||
      (selectedLocation !== "All Locations" && (
        idea.address_detail?.state?.toLowerCase().includes(selectedLocation.toLowerCase()) ||
        idea.address_detail?.country?.toLowerCase().includes(selectedLocation.toLowerCase())
      ));

    // Industry matching
    const matchesIndustry = selectedIndustries.length === 0 ||
      selectedIndustries.includes(idea.industry);

    return matchesSearch && matchesLocation && matchesIndustry;
  });

  return (
    <div className="flex flex-col w-full">
      <ChatInstruction onSearch={handleSearchFromChat} />
      {/* Main Content Layout */}
      <div className="w-full">
        {/* Main Content Area */}
        <div>
          {/* Page Heading with navbar-style bubble */}
          <div className="navbar bg-gray-50 text-black p-6">
            <div className="flex-1">
              <div className="bg-base-200 rounded-full px-8 py-4 shadow-lg flex items-center">
                <div className="text-xl">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text font-bold text-2xl">
                    Business Marketplace
                  </span>
                  <p className="text-base text-gray-600 mt-2">Discover and explore innovative business products</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Location Bar */}
          <div className="px-6 py-4 mt-4">
            {showSearchBar && (
              <div className="bg-base-200 rounded-3xl px-8 py-6 shadow-lg">
                <div className="flex gap-4 mb-4">
                  {/* Search Bar */}
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <IoSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search ideas by name..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Location Dropdown */}
                  <div className="dropdown">
                    <label tabIndex={0} className="btn bg-white hover:bg-gray-100 border-gray-200 text-gray-700 rounded-full flex items-center gap-2 min-w-[180px] py-3">
                      <IoLocationOutline className="h-5 w-5" />
                      {selectedLocation}
                    </label>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-white rounded-2xl w-72 mt-2 max-h-[300px] overflow-y-auto">
                      {uniqueLocations.map((location) => (
                        <li key={location}>
                          <a
                            className={`hover:bg-gray-50 rounded-xl ${selectedLocation === location ? 'bg-blue-50 text-blue-600' : ''}`}
                            onClick={() => setSelectedLocation(location)}
                          >
                            {location}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Industry Filters - Using passed in industries */}
                <div className="grid grid-cols-6 gap-3 mt-4">
                  {industries.map((industry) => {
                    const Icon = selectedIndustries.includes(industry.id) ? industry.selectedIcon : industry.icon;
                    return (
                      <button
                        key={industry.id}
                        onClick={() => toggleIndustry(industry.id)}
                        className={`px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 text-center
                            ${selectedIndustries.includes(industry.id)
                            ? 'bg-blue-100 text-blue-600 border-2 border-blue-200 shadow-md'
                            : 'bg-white text-gray-600 border-2 border-gray-100 hover:bg-gray-50 hover:shadow-md'
                          }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{industry.label}</span>
                        </div>
                      </button>
                    )
                  }
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Ideas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredIdeas.map((idea) => (
              <div
                key={idea.id}
                className="card bg-base-200 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative"
                onClick={() => handleCardClick(idea.id)}
              >
                <figure className="relative">
                  {idea.tags && idea.tags.length > 0 && (
                    <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
                      {idea.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-white bg-opacity-90 text-blue-600 px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <img
                    src={idea.media[0]}
                    alt={idea.title}
                    className="w-full h-72 object-cover rounded-t-xl"
                  />
                </figure>
                <div className="card-body p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <h2 className="card-title text-gray-800 font-semibold">{idea.title}</h2>
                      {idea.verified && (
                        <div className="bg-emerald-500 text-white p-1 rounded-full shadow-sm flex items-center justify-center" title="Verified On-Chain">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 text-sm font-medium">
                      <span className="flex items-center text-emerald-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                        </svg>
                        {idea.upvotes}
                      </span>
                      <span className="flex items-center text-rose-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 8.707l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L9 10.586V7a1 1 0 112 0v3.586l1.293-1.293a1 1 0 011.414 1.414z" clipRule="evenodd" />
                        </svg>
                        {idea.downvotes}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md">{idea.industry}</span>
                      {idea.verified && (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          Verified On-Chain
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {idea.address_detail.suburb},{idea.address_detail.state},{idea.address_detail.country}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdeaComponent;
