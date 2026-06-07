"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Eenvoudige rich text editor (Tiptap) die HTML produceert voor Shopify's
 * descriptionHtml. Houdt een verborgen <input> bij met de naam `name`, zodat
 * de waarde gewoon met het form (Server Action) wordt meegestuurd.
 */

type Props = {
  name: string;
  defaultValue?: string;
};

function Btn({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "rounded px-2 py-1 text-xs font-medium hover:bg-muted",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 px-1.5 py-1">
      <Btn title="Vet" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="font-bold">B</span>
      </Btn>
      <Btn title="Cursief" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span className="italic">I</span>
      </Btn>
      <Btn title="Doorhalen" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <span className="line-through">S</span>
      </Btn>
      <span className="mx-1 h-4 w-px bg-border" />
      <Btn title="Kop 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </Btn>
      <Btn title="Kop 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </Btn>
      <span className="mx-1 h-4 w-px bg-border" />
      <Btn title="Opsomming" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • Lijst
      </Btn>
      <Btn title="Genummerd" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1. Lijst
      </Btn>
      <Btn title="Citaat" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        ❝
      </Btn>
      <span className="mx-1 h-4 w-px bg-border" />
      <Btn title="Ongedaan maken" onClick={() => editor.chain().focus().undo().run()}>
        ↺
      </Btn>
      <Btn title="Opnieuw" onClick={() => editor.chain().focus().redo().run()}>
        ↻
      </Btn>
    </div>
  );
}

export function RichText({ name, defaultValue = "" }: Props) {
  const [html, setHtml] = useState(defaultValue);

  const editor = useEditor({
    extensions: [StarterKit],
    content: defaultValue,
    immediatelyRender: false, // vereist voor SSR in Next.js
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-40 px-3 py-2 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  return (
    <div className="rounded-lg border border-input bg-transparent">
      {editor ? <Toolbar editor={editor} /> : null}
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
