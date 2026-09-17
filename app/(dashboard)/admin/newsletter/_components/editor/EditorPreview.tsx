const EditorPreview = ({ previewMode, generatedHtml }: any) => {
  return (
    <main
      className={`w-full flex-1 p-2 md:p-6 flex justify-center items-start overflow-y-auto ${
        previewMode === "desktop" ? "hidden md:flex" : "flex"
      }`}
    >
      <div className="w-full max-w-[650px] mx-auto bg-white rounded-lg shadow-sm min-h-[500px]">
        <iframe
          title="Preview"
          srcDoc={generatedHtml}
          className="w-full h-full border-none block min-w-full"
          style={{ width: "100%", minWidth: "100%", minHeight: "100vh" }}
        />
      </div>
    </main>
  );
};

export default EditorPreview;
