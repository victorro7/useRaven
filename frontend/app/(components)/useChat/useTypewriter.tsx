 /* eslint-disable @typescript-eslint/no-explicit-any */
// app/(components)/useChat/TextGenerateEffect.tsx (Updated)
"use client";
import { useEffect, useState } from "react";
import { motion, stagger, useAnimate } from "motion/react";
import { cn } from "@/lib/utils";
import { ParsedContentPart } from "@/lib/parseContent"; // Import the type
import { CodeBlock } from "../ui/code-block";

interface TextGenerateEffectProps {
  parsedContent: ParsedContentPart[]; // Use the correct type
  className?: string;
  filter?: boolean;
  duration?: number;
}

export const TextGenerateEffect = ({
  parsedContent,
  className,
  filter = true,
  duration = 0.05,
}: TextGenerateEffectProps) => {
  const [scope, animate] = useAnimate();
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const animateText = async () => {
      if (scope.current) {
          setCompleted(false); // Reset completed state
        const elements = scope.current.querySelectorAll(
          "span, strong, h1, h2, h3, h4, h5, h6, li, ul, ol, pre, code"
        );

        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          await animate(element, { opacity: 1, filter: "blur(0px)" }, { duration: duration, delay: stagger(0.0005) });
        }
        setCompleted(true);
      }
    };

    animateText();
  }, [parsedContent, animate, duration, scope]);

  const renderContent = () => {
    const componentMap: Record<string, any> = {
      text: motion.span,
      strong: motion.strong,
      h1: motion.h1,
      h2: motion.h2,
      h3: motion.h3,
      h4: motion.h4,
      h5: motion.h5,
      h6: motion.h6,
      li: motion.li,
      ul: motion.ul,
      ol: motion.ol,
      code: motion.code,
    };

    return (
      <motion.div ref={scope}>
        {parsedContent.map((item, idx) => {
          // Handle text nodes (newlines, etc.)
          if (item.type === "text") {
            return (
              <motion.span
                key={`text-${idx}`}
                className="text-white opacity-0"
                style={{
                  opacity: completed ? 1 : 0,
                  filter: filter ? "blur(10px)" : "none",
                  transition: "opacity 0.5s, filter 0.5s"}}
              >
                {item.content}
              </motion.span>
            );
          }

          const Component = componentMap[item.type] || motion.span; // Default to span

          // Handle lists (ul and ol)
          if (item.type === "ul" || item.type === "ol") {
            return (
              <Component key={`${item.type}-${idx}`} className="text-white opacity-0 list-disc list-inside">
                {item.items.map((liItem, liIdx) => {  // Correctly access items
                  if (liItem.type === "li") {
                    return (
                      <motion.li
                        key={`li-${idx}-${liIdx}`}
                        className="text-white opacity-0 ml-4"
                        style={{
                          opacity: completed ? 1 : 0,
                          filter: filter ? "blur(10px)" : "none",
                          transition: "opacity 0.5s, filter 0.5s",
                         }}
                      >
                        {liItem.content}
                      </motion.li>
                    );
                  }
                  return null; // Should not happen with correct parsing
                })}
              </Component>
            );
          }

          // inline code
          if (item.type === 'code' && !item.language) {
            return (
              <motion.code
                key={`inline-code-${idx}`}
                className="text-green-500 bg-slate-900 rounded px-2 py-1 font-mono opacity-0" // Updated classNames
                style={{
                  opacity: completed ? 1 : 0,
                  filter: filter ? 'blur(10px)' : 'none',
                  transition: 'opacity 0.5s, filter 0.5s',
                }}
              >
                {item.content}
              </motion.code>
            );
          }

          // Handle code blocks
          if (item.type === "code") {
            return (
              <CodeBlock
                key={`${item.type}-${idx}`}
                language={String(item.language)}
                filename={item.type}
                code={item.content}
              />
            );
          }

          let headingClassName = "text-white opacity-0"; // Default
          if (item.type === 'h1') headingClassName += " text-4xl font-bold"; // Example: h1
          else if (item.type === 'h2') headingClassName += " text-3xl font-semibold"; // Example: h2
          else if (item.type === 'h3') headingClassName += " text-2xl font-medium"; // Example: h3
          else if (item.type === 'h4') headingClassName += " text-xl font-medium";
          else if (item.type === 'h5') headingClassName += " text-lg font-medium";
          else if (item.type === 'h6') headingClassName += " text-base font-medium";

          return (
            <Component
              key={`${item.type}-${idx}`}
              className={headingClassName}
              style={{
                opacity: completed ? 1 : 0,
                filter: filter ? "blur(10px)" : "none",
                transition: "opacity 0.5s, filter 0.5s"
              }}
            >
              {item.content}
            </Component>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className={cn("", className)}>
      <div className="mt-1">
        <div className="mb-2 whitespace-pre-wrap">{renderContent()}</div>
      </div>
    </div>
  );
};