import useNewsletter from "@/app/hooks/useNewsletter";
import {
  ChevronLeft,
  Loader2,
  Monitor,
  Save,
  Send,
  Smartphone,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmBroadcast from "./ConfirmBroadcast";
import { onFailure, onSuccess } from "@/app/_utils/notification";

const Editor = ({ setIsEditorOpen, formData, setFormData, editingId }: any) => {
  const { updateNewsletter, createNewsletter, broadcastNewsletter } =
    useNewsletter();

  const isBroadcasting =
    broadcastNewsletter.isPending || updateNewsletter.isPending;
  const [showFinalCheck, setShowFinalCheck] = useState(false);

  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">(
    "desktop",
  );

  const [debouncedData, setDebouncedData] = useState(formData);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedData(formData), 400);
    return () => clearTimeout(handler);
  }, [formData]);

  const generatedHtml = useMemo(() => {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background-color: #f9f9f8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .email-container { background: #ffffff; margin: 20px auto; max-width: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #eee; }
    /* The fixed orange header */
    .header { background: #ff3b0a; padding: 25px; text-align: center; color: white; font-weight: 900; font-size: 24px; text-transform: uppercase; letter-spacing: 4px; }
    .body { padding: 40px; color: #333333; line-height: 1.6; font-size: 16px; }
    /* The Subject display inside the mail */
    .subject-preview { color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    .main-title { font-size: 22px; font-weight: 800; color: #111; margin-bottom: 24px; line-height: 1.2; }
    .footer { padding: 30px; background: #fafafa; border-top: 1px solid #eeeeee; font-size: 12px; color: #aaaaaa; text-align: center; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">BOUWNCE</div>
    <div class="body">
      <div class="subject-preview">Subject: ${debouncedData.subject || "No Subject"}</div>
      
      <p style="font-size: 16px; font-weight: bold; color: #444;">Hi [Customer Name],</p>
      <div style="white-space: pre-wrap; color: #555;">${debouncedData.content || "Start typing your content..."}</div>
    </div>
    <div class="footer">
      &copy; 2026 Bounce Branding Team<br/>
      You are receiving this because you opted into our newsletter.
    </div>
  </div>
</body>
</html>`;
  }, [debouncedData.subject, debouncedData.content]);

  const handleBroadcast = () => {
    const action = editingId ? updateNewsletter : createNewsletter;
    action.mutate(
      editingId ? { id: editingId, payload: formData } : (formData as any),
      {
        onSuccess: async (res, variables: any) => {
          setFormData(res.data);
          const id = variables.id;
          if (id) {
            await broadcastNewsletter.mutateAsync(id);
            setIsEditorOpen(false);
            setShowFinalCheck(false);
          }
        },
      },
    );
  };

  const isSaving = createNewsletter.isPending || updateNewsletter.isPending;

  // --- VALIDATION HELPER ---
  const validateForm = () => {
    if (!formData.name?.trim()) {
      onFailure({
        title: "Missing Name",
        message: "Please provide an internal name for this campaign.",
      });
      return false;
    }
    if (!formData.subject?.trim()) {
      onFailure({
        title: "Missing Subject",
        message: "A public subject line is required.",
      });
      return false;
    }
    if (!formData.content?.trim()) {
      onFailure({
        title: "Missing Content",
        message: "The email content cannot be empty.",
      });
      return false;
    }
    return true;
  };

  const handleSaveDraft = () => {
    if (!validateForm()) return;
    const action = editingId ? updateNewsletter : createNewsletter;
    action.mutate(
      editingId ? { id: editingId, payload: formData } : (formData as any),
      {
        onSuccess: () => {
          onSuccess({
            title: "Success",
            message: "Newsletter updated successfully!",
          });

          setIsEditorOpen(false);
        },
      },
    );
  };
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <header className="h-auto min-h-20 border-b border-stone-100 flex flex-wrap items-center justify-between px-4 md:px-10 py-4 gap-4 shrink-0">
        <div className="flex items-center gap-4 flex-1 min-w-60">
          <button
            onClick={() => setIsEditorOpen(false)}
            className="text-stone-400 hover:text-stone-900 flex items-center gap-2 font-bold text-xs uppercase shrink-0"
          >
            <ChevronLeft size={20} /> Exit
          </button>
          <div className="h-6 w-px bg-stone-100 hidden md:block" />
          <input
            className="text-lg font-bold focus:outline-none w-full max-w-50 md:max-w-xs"
            placeholder="Campaign Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          {/* This toggle now switches between Edit Mode and Preview Mode on mobile */}
          <div className="flex bg-stone-100 p-1 rounded-full shrink-0">
            <button
              onClick={() => setPreviewMode("desktop")}
              className={`p-2 px-3 md:px-6 rounded-full text-[10px] font-black uppercase transition-all flex items-center gap-2 ${previewMode === "desktop" ? "bg-white shadow-sm text-stone-900" : "text-stone-400"}`}
            >
              <Monitor size={14} />{" "}
              <span className="hidden xs:inline">Edit</span>
            </button>
            <button
              onClick={() => setPreviewMode("mobile")}
              className={`p-2 px-3 md:px-6 rounded-full text-[10px] font-black uppercase transition-all flex items-center gap-2 ${previewMode === "mobile" ? "bg-white shadow-sm text-stone-900" : "text-stone-400"}`}
            >
              <Smartphone size={14} />{" "}
              <span className="hidden xs:inline">Preview</span>
            </button>
          </div>

          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="bg-stone-100 text-stone-600 p-3 md:px-5 md:py-3 rounded-full font-bold text-xs uppercase hover:bg-stone-200 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            <span className="hidden md:inline">
              {isSaving ? "Saving..." : "Save"}
            </span>
          </button>

          <button
            onClick={() => setShowFinalCheck(true)}
            disabled={isSaving || isBroadcasting}
            className="bg-[#ff3b0a] text-white p-3 md:px-6 md:py-3 rounded-full font-bold text-xs uppercase hover:bg-black transition-all flex items-center gap-2 shrink-0"
          >
            <span className="hidden md:inline">Broadcast</span>{" "}
            <Send size={14} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#f9f9f8]">
        {/* SIDEBAR EDITOR: Hidden on mobile when Preview is active */}
        <aside
          className={`w-full md:max-w-112.5 bg-white border-r border-stone-100 overflow-y-auto p-8 md:p-12 space-y-10 z-20 shrink-0 ${previewMode === "mobile" ? "hidden md:block" : "block"}`}
        >
          <div className="space-y-8">
            <div>
              <label className="text-[10px] font-black text-stone-300 uppercase mb-3 block">
                Campaign Description
              </label>
              <input
                className="w-full border-b border-stone-100 focus:border-stone-900 transition-all py-2 outline-none text-sm italic text-stone-800"
                placeholder="Campaign Notes"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-stone-300 uppercase mb-3 block">
                Public Subject Line
              </label>
              <input
                className="w-full border-b-2 border-stone-100 focus:border-[#ff3b0a] transition-all py-4 outline-none font-bold text-xl"
                placeholder="Email Subject Line"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-stone-300 uppercase mb-3 block">
                Message Content
              </label>
              <textarea
                className="w-full min-h-[40vh] md:min-h-50 bg-stone-50 rounded-2xl p-6 outline-none font-medium text-stone-800 text-md resize-none"
                placeholder="Write here..."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
              />
            </div>
          </div>
        </aside>

        {/* PREVIEW AREA: Hidden on mobile when Edit is active */}
        <main
          className={`flex-1 p-4 md:p-10 flex justify-center items-center overflow-hidden h-full ${previewMode === "desktop" ? "hidden md:flex" : "flex"}`}
        >
          <div
            className={`transition-all duration-500 ease-in-out flex flex-col bg-white shadow-2xl p-2 ${
              previewMode === "mobile"
                ? "w-full md:max-w-80 h-full md:max-h-200 ring-0 md:ring-8 ring-stone-900 rounded-xl"
                : "w-full max-w-225 h-full rounded-xl border border-stone-200"
            }`}
          >
            <div className="flex-1 w-full overflow-hidden">
              <iframe
                title="Preview"
                srcDoc={generatedHtml}
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </main>
      </div>

      {showFinalCheck && (
        <ConfirmBroadcast
          setShowFinalCheck={setShowFinalCheck}
          formData={formData}
          handleBroadcast={handleBroadcast}
          isBroadcasting={isBroadcasting}
        />
      )}
    </div>
  );
};

export default Editor;
