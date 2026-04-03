import React from 'react';

const parseInline = (value: string, keyPrefix: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
  tokenRegex.lastIndex = 0;
  let last = 0;
  let idx = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(value)) !== null) {
    const start = match.index;
    const token = match[0];

    if (start > last) nodes.push(value.slice(last, start));

    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(<strong key={`${keyPrefix}-s-${idx++}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(<em key={`${keyPrefix}-e-${idx++}`}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(<code key={`${keyPrefix}-c-${idx++}`}>{token.slice(1, -1)}</code>);
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (linkMatch) {
        nodes.push(
          <a key={`${keyPrefix}-a-${idx++}`} href={linkMatch[2]} target="_blank" rel="noreferrer">
            {linkMatch[1]}
          </a>
        );
      } else {
        nodes.push(token);
      }
    }

    last = tokenRegex.lastIndex;
  }

  if (last < value.length) nodes.push(value.slice(last));
  return nodes;
};

export const renderBasicMarkdown = (markdown: string): React.ReactNode[] => {
  const lines = markdown.trim().split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (keyBase: string) => {
    if (!listItems.length) return;
    blocks.push(
      <ul key={`${keyBase}-ul`}>
        {listItems.map((item, idx) => (
          <li key={`${keyBase}-li-${idx}`}>{parseInline(item, `${keyBase}-li-${idx}`)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((raw, lineIndex) => {
    const line = raw.trim();
    const key = `md-${lineIndex}`;

    if (!line) {
      flushList(key);
      return;
    }

    if (line.startsWith('- ')) {
      listItems.push(line.slice(2));
      return;
    }

    flushList(key);

    if (line.startsWith('### ')) {
      blocks.push(<h3 key={key}>{parseInline(line.slice(4), `${key}-h3`)}</h3>);
    } else if (line.startsWith('## ')) {
      blocks.push(<h2 key={key}>{parseInline(line.slice(3), `${key}-h2`)}</h2>);
    } else if (line.startsWith('# ')) {
      blocks.push(<h1 key={key}>{parseInline(line.slice(2), `${key}-h1`)}</h1>);
    } else {
      blocks.push(<p key={key}>{parseInline(line, `${key}-p`)}</p>);
    }
  });

  flushList('md-end');
  return blocks;
};
