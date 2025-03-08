import { useState, useEffect } from "react";
import { MdWebhook } from "react-icons/md";
import { FaPlus, FaTimes, FaGhost, FaPencilAlt, FaTrash } from "react-icons/fa";
import Alert from "@/components/Alert";
import { GameData } from "@/app/utils/AppContext";
import ComingSoon from "./commingSoon";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function WebhookSection({ selectedGame }: { selectedGame: GameData }) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
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

  useEffect(() => {
    const fetchWebhooks = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setWebhooks([
        {
          id: '1',
          url: 'https://api.example.com/webhook1',
          events: ['game.created', 'game.updated'],
          status: 'active',
          createdAt: '2024-03-20'
        },
        {
          id: '2',
          url: 'https://api.example.com/webhook2',
          events: ['transaction.completed'],
          status: 'inactive',
          createdAt: '2024-03-19'
        }
      ]);
    };

    fetchWebhooks();
  }, []);

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Compact Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black border border-white/10 rounded-full flex items-center justify-center">
              <MdWebhook className="text-2xl text-[#0CC0DF]" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-light">Webhooks</h1>
              <p className="text-white/40 text-sm">{webhooks.length} active connections</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-[#0CC0DF]/10 border border-[#0CC0DF]/20 rounded-lg text-[#0CC0DF] 
                     hover:bg-[#0CC0DF]/20 transition-all duration-300 flex items-center gap-2"
          >
            <FaPlus className="text-sm" />
            Add Connection
          </button>
        </div>
      </div>

      {/* Simplified Table */}
      <div className="max-w-6xl mx-auto">
        <div className="rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-6 bg-white/5 text-white/60 text-sm">
            <div className="col-span-5">Who To Call</div>
            <div className="col-span-4">What Happened</div>
            <div className="col-span-3 text-right">What To Send</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/[0.06]">
            {webhooks.map(webhook => (
              <div key={webhook.id}
                className="grid grid-cols-12 gap-4 p-6 hover:bg-white/[0.02] group transition-all duration-200">
                <div className="col-span-4">
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map(event => (
                      <span key={event}
                        className="px-2.5 py-1 bg-[#0CC0DF]/10 rounded-full text-[#0CC0DF] text-xs font-medium">
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-span-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <MdWebhook className="text-[#0CC0DF]" />
                    </div>
                    <div>
                      <div className="text-white/80 font-light break-all">
                        {webhook.url}
                      </div>
                      <div className="text-white/40 text-xs mt-1">
                        Created {new Date(webhook.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-3 flex items-center justify-end gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${webhook.status === 'active'
                      ? 'bg-[#14F195]/10 text-[#14F195]'
                      : 'bg-white/[0.03] text-white/40'
                    }`}>
                    {webhook.status}
                  </span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
                      <FaPencilAlt className="text-white/60 hover:text-white text-xs" />
                    </button>
                    <button className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
                      <FaTrash className="text-white/60 hover:text-white text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State - Updated styling */}
        {webhooks.length === 0 && (
          <div className="text-center py-16 bg-white/[0.02] rounded-xl border border-white/[0.06]">
            <FaGhost className="text-white/10 text-5xl mx-auto mb-4" />
            <p className="text-white/40 font-light">No webhook connections yet</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 px-4 py-2 bg-[#0CC0DF]/10 border border-[#0CC0DF]/20 rounded-lg text-[#0CC0DF] 
                       hover:bg-[#0CC0DF]/20 transition-all duration-300 text-sm"
            >
              Add your first webhook
            </button>
          </div>
        )}
      </div>

      {/* Create Webhook Modal */}
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