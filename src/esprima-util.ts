import * as esprima from 'esprima';

export interface Node {
    type: string;
    range?: [number, number];
    loc?: SourceLocation;
}

export interface Position {
    line: number;
    column: number;
}

export interface SourceLocation {
    start: Position;
    end: Position;
    source?: string | null;
}

export const knownIdentifiers = 
    {
        describeLike : ['describe', 'context', 'suite'],
        itLike : ['it', 'specify', 'test']
    }

export function retrieveDebuggableTokens(script: string) {
    let tokens = esprima.tokenize(script, { loc: true, range: true });
    let describeTokens = tokens
        .filter(t => t.type === 'Identifier')
        .filter(t => knownIdentifiers.describeLike.some(e=>e===t.value));
    let itTokens = tokens
        .filter(t => t.type === 'Identifier')
        .filter(t => knownIdentifiers.itLike.some(e=>e===t.value));
    return {describeTokens, itTokens}
}

export function extractAllNodes(root) {
    let res = [];
    let nodesToInspect = [root];
    while (nodesToInspect.length > 0) {
        nodesToInspect = nodesToInspect.filter(n => typeof n === 'object');
        let inspectedNode = nodesToInspect.shift();
        if (inspectedNode) {
            if (inspectedNode.type) {
                res.push(inspectedNode);
            }
            nodesToInspect.push(...Object.values(inspectedNode));
        }

    }
    return res;
}

export function isStricltyInside(child, parent) {
    return child.range[0] > parent.range[0] && child.range[1] < parent.range[1];
}

/** Should be used on arrays of nodes where no two nodes have coinciding range (same range[0] 
 * __or__ same range[1]) 
 * 
 * @returns {any[]} an array, starting with node, and with parent nodes following from closest
 * to largest
 * */
export function getParents(node, nodes: any[]) {
    let parents = nodes.filter(p=>isStricltyInside(node,p));
    return [node, ...parents.sort((n,m)=>m.range[0]-n.range[0])];
}