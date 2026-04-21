"use client";

import { useState } from "react";
import useNewsletters from "@/app/hooks/useNewsletter";

const mockNewsletters = [
  { id: 1, subject: "Welcome to the New Collection", status: "Draft", date: "2026-04-21" },
  { id: 2, subject: "Exclusive Early Access", status: "Broadcasted", date: "2026-04-18" }
];

export default function NewsletterDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ editingId, setEditingId] = useState<string | null>(null);
  const [ formData, setFormData ] = useState({ subject: "", content: "" });

  const { getNewsletters } = useNewsletters();
  const [ currentPage, setCurrentPage ] = useState(1);
  const { data: newslettersData, isLoading, isError } = getNewsletters(currentPage, 10);
  console.log(newslettersData);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalOpen(false);
  };

  const handleEditClick = (newsletter: any) => {
    setEditingId(newsletter.id);
    setFormData({ subject: newsletter.subject, content: newsletter.content });
    setIsModalOpen(true);
  };

  const handleCreateNewClick = () => {
    setEditingId(null);
    setFormData({ subject: "", content: "" });
    setIsModalOpen(true);
  };

  const handleBroadcast = (id: number, subject: string) => {
    if (window.confirm(`Are you sure you want to broadcast "${subject}" to all subscribers?`)) {
      console.log("Broadcasting newsletter ID:", id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 text-stone-900">
      
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Newsletters</h1>
          <p className="text-stone-500 mt-1">Manage and broadcast email campaigns.</p>
        </div>
        <button 
          onClick={handleCreateNewClick}
          className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-md font-medium transition-colors"
        >
          + Create Newsletter
        </button>
      </div>

      {/* Newsletter List / Table */}
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200 text-sm uppercase tracking-wider text-stone-500">
              <th className="px-6 py-4 font-medium">Subject</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {mockNewsletters.map((newsletter) => (
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
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-8 relative">
            <h2 className="text-2xl font-semibold mb-6">Create New Campaign</h2>
            
            <form onSubmit={handleCreateSubmit} className="space-y-5">
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