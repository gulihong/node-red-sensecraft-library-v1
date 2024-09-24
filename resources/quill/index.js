let quill;
$(document).ready(function () {
  let timeout = setTimeout(() => {
    initQuill();
    clearTimeout(timeout);
    timeout = null;
  }, 500);
});

function initQuill() {
  if (!Quill) return;
  quill = new Quill("#quill-editor", {
    theme: "snow",
    bounds: document.body,
    debug: "warn",
    modules: {
      toolbar: {
        container: [
          ["bold", "italic", "underline", "strike"],
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ size: ["small", false, "large", "huge"] }],
          [{ color: [] }, { background: [] }],
          ["blockquote", "code-block"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ script: "sub" }, { script: "super" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [{ align: [] }],
          [{ direction: "rtl" }],
          [{ font: [] }],
          ["clean"],
          ["image"],
          ["link"],
        ],
        handlers: {
        },
      },
      history: {
        delay: 2000,
        maxStack: 500,
        userOnly: true,
      },
    },
    placeholder: "...",
    readOnly: false,
  });
  window.quill = null;
  window.quill = quill;
}
