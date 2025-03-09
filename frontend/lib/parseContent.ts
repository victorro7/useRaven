// lib/parseContent.ts
const escapeHtml = (unsafe: string | undefined) => {
    if (typeof unsafe !== 'string') {
        return '';
    }
    return unsafe
        .replace(/&/g, "&")
        .replace(/</g, "<")
        .replace(/>/g, ">")
        .replace(/"/g, '"')
        .replace(/'/g, "'");
};

const headingRegex = /^(#+)\s+(.*)$/gm;
const boldRegex = /\*\*(.*?)\*\*/g;
const unorderedListRegex = /^-\s+(.*)$/gm;
// const orderedListRegex = /^\d+\.\s+(.*)$/gm;
const blockCodeRegex = /^```([a-zA-Z0-9+#-]+)?\n([\s\S]*?)```$/m;

export type ParsedContentPart =
    | { type: 'text'; content: string }
    | { type: 'strong'; content: string }
    | { type: 'h1'; content: string }
    | { type: 'h2'; content: string }
    | { type: 'h3'; content: string }
    | { type: 'h4'; content: string }
    | { type: 'h5'; content: string }
    | { type: 'h6'; content: string }
    | { type: 'li'; content: string }
    | { type: 'ul'; items: ParsedContentPart[] }
    | { type: 'ol'; items: ParsedContentPart[] }
    | { type: 'code'; content: string; language?: string };

export const parseContent = (text: string): ParsedContentPart[] => {
    const result: ParsedContentPart[] = [];
    let remainingText = text;

    while (remainingText) {
        const match = blockCodeRegex.exec(remainingText);

        if (match) {
            console.log(match[1]);
            const beforeCode = remainingText.substring(0, match.index);
            const codeContent = match[2];
            const codeBlockLength = match[0].length;

            if (beforeCode) {
                const nonCodeParts = processNonCodeText(beforeCode);
                result.push(...nonCodeParts);
            }

            result.push({ type: 'code', content: codeContent, language: match[1] }); // No escaping here

            remainingText = remainingText.substring(match.index + codeBlockLength);
        } else {
            const nonCodeParts = processNonCodeText(remainingText);
            result.push(...nonCodeParts);
            remainingText = '';
        }
    }

    return result;
};

const processNonCodeText = (text: string): ParsedContentPart[] => {
    const parts: ParsedContentPart[] = [];
    const lines = text.split('\n');

    lines.forEach((line) => {
      let tempLine = line;
      let match;

      if ((match = headingRegex.exec(tempLine))) {
        const level = match[1].length;
        const content = match[2];

        let headingType: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' = 'h1';
        if (level === 1) headingType = 'h1';
        else if (level === 2) headingType = 'h2';
        else if (level === 3) headingType = 'h3';
        else if (level === 4) headingType = 'h4';
        else if (level === 5) headingType = 'h5';
        else if (level === 6) headingType = 'h6';

        parts.push({ type: headingType, content: escapeHtml(content) });
        tempLine = '';
      }

      if (tempLine) {
        let temp = tempLine;
        while ((match = boldRegex.exec(temp))) {
          const before = temp.substring(0, match.index);
          const bold = match[1];
          const after = temp.substring(match.index + match[0].length);
  
          if (before) parts.push({ type: 'text', content: escapeHtml(before) });
          parts.push({ type: 'strong', content: escapeHtml(bold) });
          temp = after;
        }
        if (temp) parts.push({ type: 'text', content: escapeHtml(temp) });
      }
      parts.push({ type: 'text', content: '\n' }); //Keep the new lines.
    });
  
    const groupedResult = groupListItems(parts);
    return groupedResult;
  };

const groupListItems = (parts: ParsedContentPart[]): ParsedContentPart[] => {
    const groupedResult: ParsedContentPart[] = [];
    let currentList: { type: 'ul' | 'ol'; items: ParsedContentPart[] } | null = null;

    parts.forEach((item) => {
        if (item.type === 'li') {
            const listType = unorderedListRegex.test(item.content) ? 'ul' : 'ol';
            if (!currentList || currentList.type !== listType) {
                currentList = { type: listType, items: [] };
                groupedResult.push(currentList);
            }
            currentList.items.push(item);
        } else {
            if (currentList) {
                currentList = null;
            }
            groupedResult.push(item);
        }
    });

    return groupedResult;
};