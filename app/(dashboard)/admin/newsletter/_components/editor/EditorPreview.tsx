const EditorPreview = ({ previewMode, generatedHtml }: any) => {
  return (
    <main
      className={`flex-1 p-4 md:p-10 flex justify-center items-center ${
        previewMode === "desktop" ? "hidden md:flex" : "flex"
      }`}
    >
      <iframe
        title="Preview"
        srcDoc={generatedHtml}
        className="w-full h-full border-none"
      />
    </main>
  );
};

export default EditorPreview;
