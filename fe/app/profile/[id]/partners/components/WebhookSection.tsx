'use client'
import { useState, useEffect } from "react";
import { MdWebhook } from "react-icons/md";
import { FaPlus, FaTimes, FaGhost, FaPencilAlt, FaTrash } from "react-icons/fa";
import Alert from "@/components/Alert";
import { GameData } from "@/app/utils/AppContext";
import { AppProvider, useAppContext, UserData } from "@/app/utils/AppContext";
import { Db, Server, FrontEnd } from "@/app/utils/db";
import router from "next/router";
import { OfferProps } from "../../components/ideaCard";
import { useRouter } from 'next/navigation';
import ComingSoon from "@/app/dashboard/components/commingSoon";

interface DealDetails {
  id: string;
  created_at: string;
  status: boolean;
  from_user: UserData;
  to_user: UserData;
  offer: OfferProps;
}

export default function WebhookSection() {
  const { auth, getUser } = useAppContext();
  const [deals, setDeals] = useState<DealDetails[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    url: '',
    events: [] as string[],
  });
  const [alert, setAlert] = useState({
    show: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'info'
  });
  const router = useRouter();

  useEffect(() => {
    let user = auth.userData;
    if (!user) {
      user = getUser();
      console.log("welcome back", user);
      if (!user) {
        router.push('/not-found');
      }
    }
    // fetching all offers for this users
    // for each offer we fetch table referral_link - relationship 1 - 1
    const fetchData = async () => {
      try {
        const { data: offersData, error: offersError } = await Db
          .from("deals")
          .select(`
          *,
          from_user:users!deals_from_user_fkey(*),
    to_user:users!deals_to_user_fkey(*),
           offer:offers(
             *,
             ideas:ideas(*)
           )
        `)
          .eq('to_user', user?.id);
        // console.log('Fetched offers:', offersData);
        if (offersError) {
          console.error('Error fetching offers:', offersError);
          throw new Error('Error fetching offers');
        }
        // Parse the data into DealDetails array
        const parsedDeals: DealDetails[] = offersData?.map(deal => ({
          id: deal.id,
          created_at: deal.created_at,
          status: deal.status,
          from_user: deal.from_user,
          to_user: deal.to_user,
          offer: deal.offer
        })) || [];
        console.log('Parsed deals with ideas:', parsedDeals);
        setDeals(parsedDeals);
      } catch (error) {
        console.error('Error fetching offers:', error);
        throw new Error('Error fetching offers');
      }
    }

    fetchData();
  }, []);

  const handleEmailClick = (e: React.MouseEvent<HTMLAnchorElement>, email: string, deal: DealDetails) => {
    let dealLink = `${FrontEnd}/idea/${deal.offer?.ideas?.id}`;
    e.preventDefault();

    const emailSubject = `Regarding our ${deal.offer.type} partnership deal`;
    const emailBody = `
Hi ${deal.from_user.name},

I'm writing regarding our partnership deal:
- Business Name: ${deal.offer?.ideas?.title}
- Payment Link: ${deal.offer.payment_link}
- Promotion Code: ${deal.offer.promotion_code || 'N/A'}
- Business Link: ${dealLink}

I'm would like to discuss .......

Looking forward to discussing this further.

Best regards,
${auth.userData?.name || 'Me'}
    `.trim();

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
  };

  const handleBusinessClick = (ideaId?: number) => {
    if (ideaId) {
      router.push(`/idea/${ideaId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Compact Header - Updated styling */}
      <div className="navbar bg-gray-50 text-black p-6">
        <div className="flex-1">
          <div className="bg-base-200 rounded-full px-8 py-4 shadow-lg flex items-center">
            <div className="text-xl">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text font-bold text-2xl">
                Business Deals
              </span>
              <p className="text-base text-gray-600 mt-2">{deals.length} active offers</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-base-200 rounded-full shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2 text-gray-700"
        >
          <FaPlus className="text-sm" />
          Add Deals
        </button>
      </div>

      {/* Simplified Table - Updated styling */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-base-200 rounded-3xl overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-6 border-b border-gray-200/10 text-gray-600 text-sm font-medium">
            <div className="col-span-2">What Happened</div>
            <div className="col-span-2">Business</div>
            <div className="col-span-3">Who To Call</div>
            <div className="col-span-3">Dealing With</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200/10">
            {deals.map(deal => (
              <div key={deal.id}
                className="grid grid-cols-12 gap-4 p-6 hover:bg-gray-100/50 group transition-all duration-200">
                <div className="col-span-2">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${!deal.status
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : deal.status
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                      {deal.offer.type}
                    </span>
                  </div>
                </div>

                <div className="col-span-2">
                  {deal.offer.ideas && (
                    <div
                      className="flex items-center gap-3 cursor-pointer hover:opacity-75 transition-opacity"
                      onClick={() => handleBusinessClick(deal.offer.ideas?.id)}
                    >
                      {deal.offer.ideas?.media?.[0] ? (
                        <img
                          src={deal.offer.ideas.media[0]}
                          alt={deal.offer.ideas.title}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                          <FaGhost className="text-gray-400" />
                        </div>
                      )}
                      <div className="text-sm font-medium text-gray-900 line-clamp-2">
                        {deal.offer.ideas.title}
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <MdWebhook className="text-xl text-blue-600" />
                    </div>
                    <div>
                      <div className="text-gray-900 font-medium break-all">
                        <a
                          href={deal.offer.payment_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 hover:underline transition-colors duration-200"
                        >
                          {deal.offer.payment_link}
                        </a>
                      </div>
                      <div className="text-gray-500 text-sm mt-1">
                        Promotion Code: {deal.offer.promotion_code}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    {deal.from_user.photo ? (
                      <a
                        href={`${FrontEnd}/profile/${deal.to_user.id}/public`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={deal.from_user.photo}
                          alt={deal.from_user.name || 'User photo'}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 hover:border-blue-400 transition-colors"
                        />
                      </a>

                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-lg font-medium">
                          {(deal.from_user.name || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="text-gray-900">
                      {/* <div className="font-medium">{deal.from_user.name || 'N/A'}</div> */}
                      <a
                        href={`${FrontEnd}/profile/${deal.to_user.id}/public`}
                        className="font-medium"
                      >
                        {deal.from_user.name || 'N/A'}
                      </a>
                      <br />
                      <a
                        href="#"
                        onClick={(e) => handleEmailClick(e, deal.from_user.email || '', deal)}
                        className="text-gray-500 text-sm hover:text-blue-600 hover:underline transition-colors duration-200"
                      >
                        {/* {deal.from_user.email || 'No email'} */}
                        Talk To Me
                      </a>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${deal.status === true
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${deal.status === true ? 'bg-green' : 'bg-red-500'
                      } animate-pulse mr-2`}></span>
                    {deal.status === true ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setShowCreateForm(true)} className="p-2 hover:bg-gray-200 rounded-full transition-all">
                      <FaPencilAlt className="text-gray-600 hover:text-gray-900 text-xs" />
                    </button>
                    <button onClick={() => setShowCreateForm(true)} className="p-2 hover:bg-red-100 rounded-full transition-all">
                      <FaTrash className="text-red-600 hover:text-red-700 text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State - Updated styling */}
        {deals.length === 0 && (
          <div className="text-center py-16 bg-base-200 rounded-3xl shadow-sm border border-gray-200/20">
            <FaGhost className="text-gray-400 text-5xl mx-auto mb-4" />
            <p className="text-gray-600 font-light">No webhook connections yet</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 px-4 py-2 bg-base-200 rounded-full shadow-sm hover:shadow-md transition-all duration-300 text-gray-700"
            >
              Add your first webhook
            </button>
          </div>
        )}
      </div>

      {/* Modal remains unchanged */}
      <ComingSoon
        showCreateForm={showCreateForm}
        setShowCreateForm={setShowCreateForm}
      />

      <Alert
        isOpen={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
} 