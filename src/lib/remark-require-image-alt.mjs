const isImageNode = (node) => node && (node.type === 'image' || node.type === 'imageReference');

const walk = (node, onNode) => {
  if (!node || typeof node !== 'object') return;
  onNode(node);

  if (!Array.isArray(node.children)) return;
  for (const child of node.children) walk(child, onNode);
};

export default function remarkRequireImageAlt() {
  return (tree, file) => {
    walk(tree, (node) => {
      if (!isImageNode(node)) return;
      const alt = typeof node.alt === 'string' ? node.alt.trim() : '';
      if (alt) return;
      file.fail('Image markdown must include non-empty alt text.');
    });
  };
}
