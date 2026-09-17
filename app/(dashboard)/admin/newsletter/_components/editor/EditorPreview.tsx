const EditorPreview = ({ previewMode, generatedHtml }: any) => {
  return (
    <main
      className={`w-full flex-1 p-2 md:p-6 flex justify-center items-start overflow-y-auto ${
        previewMode === "desktop" ? "hidden md:flex" : "flex"
      }`}
    >
      <div className="w-full max-w-[650px] mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
  <iframe
    title="Preview"
    srcDoc={generatedHtml}
    className="w-full border-none block"
    style={{
      width: "100%",
      minWidth: 0,
      height: "100vh",
      border: "none",
    }}
  />
</div>
    </main>
  );
};

export default EditorPreview;
