"use client";
import { useEffect, useState } from "react";
import { motion, stagger, useAnimate } from "motion/react";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
  htmlEffect = false,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
  htmlEffect?: boolean;
}) => {
  const [scope, animate] = useAnimate();
  const wordsArray = words.split(" ");

  useEffect(() => {
    animate(
      "span",
      {
        opacity: 1,
        filter: filter ? "blur(0px)" : "none",
      },
      {
        duration: duration ? duration : 1,
        delay: stagger(0.0005),
      }
    );
  }, [scope.current, wordsArray, filter, duration]);

  const renderWords = () => {
    return (
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => {
          if (htmlEffect) {
            return (
              <motion.span
                key={word + idx}
                className="text-white opacity-0"
                style={{
                  filter: filter ? "blur(10px)" : "none",
                }}
                dangerouslySetInnerHTML={{ __html: word + " " }}
              />
            );
          } else {
            return (
              <motion.span
                key={word + idx}
                className="text-white opacity-0"
                style={{
                  filter: filter ? "blur(10px)" : "none",
                }}
              >
                {word}{" "}
              </motion.span>
            );
          }
        })}
      </motion.div>
    );
  };

  return (
    <div className={cn("", className)}>
      <div className="mt-4">
        <div className=" mb-2 whitespace-pre-wrap">
          {renderWords()}
        </div>
      </div>
    </div>
  );
};