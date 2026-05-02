"use client";

import { useState } from "react";
import useNewsletter from "@/app/hooks/useNewsletter";
import ConfirmBroadcast from "./ConfirmBroadcast";
import { onFailure, onSuccess } from "@/app/_utils/notification";
import useGeneratedHtml from "@/app/hooks/useGeneratedHtml";
import EditorHeader from "./editor/EditorHeader";
import EditorSidebar from "./editor/EditorSidebar";
import EditorPreview from "./editor/EditorPreview";

const Editor = ({ setIsEditorOpen, formData, setFormData, editingId }: any) => {
  const { updateNewsletter, createNewsletter, broadcastNewsletter } =
    useNewsletter();

  const isBroadcasting =
    broadcastNewsletter.isPending || updateNewsletter.isPending;

  const isSaving = createNewsletter.isPending || updateNewsletter.isPending;

  const [showFinalCheck, setShowFinalCheck] = useState(false);
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">(
    "desktop",
  );

  const generatedHtml = useGeneratedHtml(formData);

  const handleBroadcast = () => {
    const action = editingId ? updateNewsletter : createNewsletter;

    action.mutate(editingId ? { id: editingId, payload: formData } : formData, {
      onSuccess: async (res: any, variables: any) => {
        setFormData(res.data);

        if (variables.id) {
          await broadcastNewsletter.mutateAsync(variables.id);
        }

        setIsEditorOpen(false);
        setShowFinalCheck(false);
      },
    });
  };

  const validateForm = () => {
    if (!formData.name?.trim()) {
      onFailure({ title: "Missing Name", message: "Add campaign name" });
      return false;
    }
    if (!formData.subject?.trim()) {
      onFailure({ title: "Missing Subject", message: "Add subject" });
      return false;
    }
    if (!formData.content?.trim()) {
      onFailure({ title: "Missing Content", message: "Add content" });
      return false;
    }
    return true;
  };

  const handleSaveDraft = () => {
    if (!validateForm()) return;

    const action = editingId ? updateNewsletter : createNewsletter;

    action.mutate(editingId ? { id: editingId, payload: formData } : formData, {
      onSuccess: () => {
        onSuccess({
          title: "Saved",
          message: "Newsletter saved successfully",
        });
        setIsEditorOpen(false);
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <EditorHeader
        setIsEditorOpen={setIsEditorOpen}
        formData={formData}
        setFormData={setFormData}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        isSaving={isSaving}
        isBroadcasting={isBroadcasting}
        handleSaveDraft={handleSaveDraft}
        setShowFinalCheck={setShowFinalCheck}
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#f9f9f8]">
        <EditorSidebar
          formData={formData}
          setFormData={setFormData}
          previewMode={previewMode}
        />

        <EditorPreview
          previewMode={previewMode}
          generatedHtml={generatedHtml}
        />
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
