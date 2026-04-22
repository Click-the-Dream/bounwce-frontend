"use client";

import { useState } from "react";
import useNewsletters from "@/app/hooks/useNewsletter";

export default function NewsletterDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ editingId, setEditingId] = useState<string | null>(null);
  const [ formData, setFormData ] = useState({ subject: "", content: "", name: "", description: "" });

  const { 
    getNewsletters,
    getNewsletterById,
    createNewsletter,
    updateNewsletter,
    deleteNewsletter,
    broadcastNewsletter,

  } = useNewsletters();
  const [ currentPage, setCurrentPage ] = useState(1);
  const { data: newslettersData, isLoading, isError } = getNewsletters(currentPage, 10);
  console.log(newslettersData);
  const newsletterList = newslettersData?.newsletters|| [];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
        updateNewsletter.mutate({ id: editingId, payload: formData});
    } else {
        createNewsletter.mutate(formData);
    }
    setIsModalOpen(false);
  };

  const handleEditClick = (newsletter: any) => {
    setEditingId(newsletter.id);
    setFormData({ 
      name: newsletter.name || "", 
      description: newsletter.description || "", 
      subject: newsletter.subject || "", 
      content: newsletter.content || ""
    });
    setIsModalOpen(true);
  };

  const handleCreateNewClick = () => {
    setEditingId(null);
    setFormData({ 
      name: "",
      description: "",
      subject: "", 
      content: "" 
    });
    setIsModalOpen(true);
  };

  const handleBroadcast = (id: number, subject: string) => {
    if (window.confirm(`Are you sure you want to broadcast "${subject}" to all subscribers?`)) {
      console.log("Broadcasting newsletter ID:", id);
    }
  };

  return (
    <div className="lg:mx-auto lg:w-[70%] p-8 text-stone-900">
      
      {/* Header Section */}
      <div className="flex justify-between flex-col md:flex-row gap-3 mb-8">
        <div>
          <h1 className="text-xl lg:text-3xl font-semibold tracking-tight">Newsletters</h1>
          <p className="text-stone-500 mt-1 text-sm lg:text-3xl">Manage and broadcast email campaigns.</p>
        </div>
        <button 
          onClick={handleCreateNewClick}
          className="bg-stone-900 hover:bg-stone-800 text-white text-[12px] px-5 py-2.5 rounded-md font-medium transition-colors"
        >
          + Create Newsletter
        </button>
      </div>

      {/* Newsletter List / Table */}
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200 text-sm uppercase tracking-wider text-stone-500">
              <th className="px-6 py-4 font-medium">Subject</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {
                isLoading ? (
                    <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-stone-500">
                            Loading campaigns...
                        </td>
                    </tr>
                ) : newsletterList.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-stone-500">
                            No newsletters found. Create a draft to get started.
                        </td>
                    </tr>
                ) : (
                    newsletterList.map((newsletter: any) => (
                        <tr key={newsletter.id} className="hover:bg-stone-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-stone-800">{newsletter.subject}</td>
                            <td className="px-6 py-4 text-stone-500">{newsletter.date}</td>
                            <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                newsletter.status === "Broadcasted" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-stone-200 text-stone-800"
                            }`}>
                                {newsletter.status}
                            </span>
                            </td>
                            <td className="px-6 py-4 text-right flex gap-2 justify-end">
                            <button
                                onClick={() => handleEditClick(newsletter)}
                                disabled={newsletter.status === "Broadcasted"}
                                className={`text-sm font-medium px-4 py-2 rounded border ${
                                newsletter.status === "Broadcasted"
                                    ? "border-stone-200 text-stone-400 cursor-not-allowed"
                                    : "border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white transition-colors"
                                }`}
                            >
                                Edit
                            </button>
                            <button 
                                onClick={() => handleBroadcast(newsletter.id, newsletter.subject)}
                                disabled={newsletter.status === "Broadcasted"}
                                className={`text-sm font-medium px-4 py-2 rounded border ${
                                newsletter.status === "Broadcasted"
                                    ? "border-stone-200 text-stone-400 cursor-not-allowed"
                                    : "border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white transition-colors"
                                }`}
                            >
                                {newsletter.status === "Broadcasted" ? "Sent" : "Broadcast"}
                            </button>
                            </td>
                        </tr>
                    ))
                )
            }            
          </tbody>
        </table>
      </div>

      {/* create newsletter modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-8 relative">
            <h2 className="text-2xl font-semibold mb-6">Create New Campaign</h2>
            
            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Campaign Name (Internal)</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Summer Drop Promo"
                  className="w-full border border-stone-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Campaign Description</label>
                <input 
                  type="text" 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Targetting active buyers from last month"
                  className="w-full border border-stone-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Subject Line</label>
                <input 
                  type="text" 
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Summer Collection Dropping Soon"
                  className="w-full border border-stone-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Email Content</label>
                <textarea 
                  required
                  rows={8}value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your newsletter content here..."
                  className="w-full border border-stone-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-stone-900 resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-stone-600 font-medium hover:bg-stone-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-md font-medium transition-colors"
                >
                  {editingId ? "Update Newsletter" : "Save Newsletter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}