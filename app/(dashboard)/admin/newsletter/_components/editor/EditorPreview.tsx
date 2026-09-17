const EditorPreview = ({ previewMode, generatedHtml }: any) => {
  return (
    <main
      className={`flex-1 p-2 md:p-10 flex justify-center items-center overflow-hidden ${
        previewMode === "desktop" ? "hidden md:flex" : "flex"
      }`}
    >
      <div className="w-full h-full max-w-[650px] mx-auto overflow-hidden rounded-lg shadow-sm">
        <iframe
          title="Preview"
          srcDoc={generatedHtml}
          className="w-full h-full border-none block"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </main>
  );
};

export default EditorPreview;
