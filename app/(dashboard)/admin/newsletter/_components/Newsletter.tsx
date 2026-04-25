"use client";

import { useState } from "react";
import { AlertCircle, Loader2, RefreshCcw, Inbox } from "lucide-react";
import useNewsletters from "@/app/hooks/useNewsletter";
import { NewsletterPayload } from "@/app/_utils/types/payload";
import NewsLetterCard from "./NewsLetterCard";
import Editor from "./Editor";

export default function CampaignStudio() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<NewsletterPayload>({
    name: "",
    subject: "",
    content: "",
    description: "",
  });

  const { getNewsletters, broadcastNewsletter } = useNewsletters();

  // Data fetching with React Query states
  const { data: response, isLoading, isError, refetch } = getNewsletters(1, 12);

  const isBroadcasting = broadcastNewsletter.isPending;
  const newsletterList = response?.newsletters || [];

  const handleOpenEditor = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        name: item.name,
        subject: item.subject,
        content: item.content,
        description: item.description || "",
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", subject: "", content: "", description: "" });
    }
    setIsEditorOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 font-sans antialiased">
      {!isEditorOpen ? (
        <div className="max-w-7xl mx-auto py-20 px-8">
          <header className="flex flex-wrap gap-4 justify-between items-end mb-12">
            <div>
              <h1 className="text-5xl font-semibold tracking-tighter">
                Newsletters
              </h1>
              <p className="text-stone-500 mt-3 text-lg font-medium">
                Manage brand communications.
              </p>
            </div>
            <button
              onClick={() => handleOpenEditor()}
              disabled={isLoading}
              className="bg-[#ff3b0a] hover:bg-[#aa3517] text-white px-10 py-3 rounded-[10px] font-bold transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + New Campaign
            </button>
          </header>

          {/* --- LOADING STATE (SKELETONS) --- */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-40 bg-stone-200/50 animate-pulse rounded-4xl border border-stone-100"
                />
              ))}
            </div>
          )}

          {/* --- ERROR STATE --- */}
          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-4xl border border-dashed border-stone-200">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold">Failed to load campaigns</h3>
              <p className="text-stone-500 mb-6">
                There was an error fetching your newsletters.
              </p>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-full font-bold hover:scale-105 transition-transform"
              >
                <RefreshCcw size={16} /> Try Again
              </button>
            </div>
          )}

          {/* --- EMPTY STATE --- */}
          {!isLoading && !isError && newsletterList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <Inbox size={48} className="text-stone-300 mb-4" />
              <h3 className="text-2xl font-bold">No campaigns yet</h3>
              <p className="text-stone-500 max-w-xs mx-auto">
                Start by creating your first brand newsletter to engage your
                audience.
              </p>
            </div>
          )}

          {/* --- DATA LIST --- */}
          {!isLoading && !isError && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {newsletterList.map((item: any) => (
                <NewsLetterCard
                  key={item.id}
                  data={item}
                  handleOpenEditor={handleOpenEditor}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <Editor
          setIsEditorOpen={setIsEditorOpen}
          formData={formData}
          setFormData={setFormData}
          editingId={editingId}
          isBroadcasting={isBroadcasting}
        />
      )}
    </div>
  );
}
