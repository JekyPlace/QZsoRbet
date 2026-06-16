import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownMessageProps = {
  content: string;
};

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="min-w-0 break-words leading-7">
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          h1: ({ children }) => (
            <h1 className="mt-7 mb-3 text-2xl leading-tight font-semibold first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-6 mb-3 text-xl leading-tight font-semibold first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-5 mb-2 text-lg leading-tight font-medium first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-3 first:mt-0 last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="my-4 list-disc space-y-2 pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-4 list-decimal space-y-2 pl-6">{children}</ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-5 border-l-4 border-black bg-[#fff333]/40 py-2 pr-3 pl-4 italic">
              {children}
            </blockquote>
          ),
          a: ({ children, node: _node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-2"
            >
              {children}
            </a>
          ),
          code: ({ children, className, node: _node, ...props }) => (
            <code
              {...props}
              className={`${className ?? ""} rounded bg-black px-1.5 py-0.5 font-mono text-[0.88em] text-[#fff333]`}
            >
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="my-5 max-w-full overflow-x-auto rounded-xl border-2 border-black bg-black p-4 leading-6 text-[#fff333] [&>code]:bg-transparent [&>code]:p-0">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-5 max-w-full overflow-x-auto rounded-lg border-2 border-black">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b-2 border-black bg-[#fff333] px-3 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-t border-black/30 px-3 py-2">{children}</td>
          ),
          hr: () => <hr className="my-6 border-t-2 border-black" />,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
