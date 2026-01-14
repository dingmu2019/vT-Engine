import React, { useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  minHeight = 240,
  className = ''
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
}) => {
  const quillRef = useRef<ReactQuill | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const modules = useMemo(() => {
    return {
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          ['clean']
        ],
        handlers: {
          image: () => {
            fileInputRef.current?.click();
          }
        }
      }
    };
  }, []);

  const formats = useMemo(() => ([
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link', 'image',
    'color', 'background',
    'align'
  ]), []);

  const insertImage = async (file: File) => {
    const reader = new FileReader();
    const dataUrl: string = await new Promise((resolve, reject) => {
      reader.onerror = () => reject(new Error('read_failed'));
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsDataURL(file);
    });

    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const range = editor.getSelection(true);
    const index = range ? range.index : editor.getLength();
    editor.insertEmbed(index, 'image', dataUrl, 'user');
    editor.setSelection(index + 1, 0);
  };

  return (
    <div className={`bg-white dark:bg-slate-950 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            await insertImage(file);
          } finally {
            e.target.value = '';
          }
        }}
      />
      <div className="bg-transparent">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
        />
      </div>
      <style>{`
        .ql-toolbar.ql-snow { border: none; border-bottom: 1px solid rgba(226,232,240,0.6); padding: 12px 16px; }
        .ql-container.ql-snow { border: none; }
        .ql-editor { min-height: ${minHeight}px; padding: 16px; font-size: 15px; line-height: 1.6; }
        .ql-editor.ql-blank::before { color: #94a3b8; font-style: normal; left: 16px; }
        
        .dark .ql-toolbar.ql-snow { border-bottom-color: rgba(30,41,59,0.5); }
        .dark .ql-toolbar.ql-snow .ql-stroke { stroke: #94a3b8; }
        .dark .ql-toolbar.ql-snow .ql-fill { fill: #94a3b8; }
        .dark .ql-toolbar.ql-snow .ql-picker { color: #94a3b8; }
        .dark .ql-editor { color: #e2e8f0; }
        .dark .ql-container.ql-snow { background: transparent; }
        .dark .ql-editor.ql-blank::before { color: #475569; }
      `}</style>
    </div>
  );
};
