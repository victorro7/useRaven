 /* eslint-disable @typescript-eslint/no-explicit-any */
// app/(components)/useChat/TextGenerateEffect.tsx (Updated)
"use client";
import { useEffect } from "react";
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

  useEffect(() => {
    animate(
      "span, strong, h1, h2, h3, h4, h5, h6, li, ul, ol, pre, code",
      {
        opacity: 1,
        filter: filter ? "blur(0px)" : "none",
      },
      {
        duration: duration,
        delay: stagger(0.005),
      }
    );
  }, [scope.current, parsedContent, animate, duration, filter]);

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
      code: CodeBlock,
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
                style={{ filter: filter ? "blur(10px)" : "none" }}
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
                        style={{ filter: filter ? "blur(10px)" : "none" }}
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

          // Handle code blocks
          if (item.type === "code") {
            return (
              <CodeBlock
              key={`${item.type}-${idx}`}
                language="python"
                filename={item.type}
                code={item.content}
              />
            );
          }

          // Handle other types (strong, h1, etc.)
          return (
            <Component
              key={`${item.type}-${idx}`}
              className="text-white opacity-0"
              style={{ filter: filter ? "blur(10px)" : "none" }}
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
      <div className="mt-4">
        <div className="mb-2 whitespace-pre-wrap">{renderContent()}</div>
      </div>
    </div>
  );
};