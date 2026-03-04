import { TextMatchTransformer, ElementTransformer } from '@lexical/markdown';
import {
  $createEquationNode,
  $isEquationNode,
  EquationNode,
} from '@/components/editor/nodes/equation-node';
import { LexicalNode, $createNodeSelection, $setSelection } from 'lexical';

export const EQUATION_INLINE: TextMatchTransformer = {
  dependencies: [EquationNode],
  export: (node: LexicalNode) => {
    if (!$isEquationNode(node)) return null;
    return node.__inline ? `$${node.getEquation()}$` : null;
  },
  importRegExp: /\$([^$]+?)\$/,
  regExp: /\$([^$]+?)\$$/,
  replace: (textNode, match) => {
    const [, equation] = match;
    const equationNode = $createEquationNode(equation, true);
    textNode.replace(equationNode);
  },
  trigger: '$',
  type: 'text-match',
};

export const EQUATION_BLOCK: ElementTransformer = {
  dependencies: [EquationNode],
  export: (node: LexicalNode) => {
    if (!$isEquationNode(node)) return null;
    return !node.__inline ? `$$${node.getEquation()}$$` : null;
  },
  regExp: /^\$\$([^$]+?)\$\$$/,
  replace: (parentNode, children, match, isImport) => {
    const [, equation] = match;
    const equationNode = $createEquationNode(equation, false);
    if (isImport || parentNode.getNextSibling() != null) {
      parentNode.replace(equationNode);
    } else {
      parentNode.insertBefore(equationNode);
    }
    const nodeSelection = $createNodeSelection();
    nodeSelection.add(equationNode.getKey());
    $setSelection(nodeSelection);
  },
  type: 'element',
};

export const EQUATION_BLOCK_QUICK: ElementTransformer = {
  dependencies: [EquationNode],
  export: () => null,
  regExp: /^\$\$ $/,
  replace: (parentNode, children, match, isImport) => {
    if (isImport) return;
    const equationNode = $createEquationNode('', false);
    if (parentNode.getNextSibling() != null) {
      parentNode.replace(equationNode);
    } else {
      parentNode.insertBefore(equationNode);
    }
    const nodeSelection = $createNodeSelection();
    nodeSelection.add(equationNode.getKey());
    $setSelection(nodeSelection);
  },
  type: 'element',
};
