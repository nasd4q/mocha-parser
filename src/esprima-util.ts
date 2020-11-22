import * as esprima from 'esprima';

export interface Node {
    type: string;
    range?: [number, number];
    loc?: LocationRange;
}

export interface Position {
    line: number;
    column: number;
}

export interface LocationRange {
    start: Position;
    end: Position;
}

export const knownIdentifiers =
{
    describeLike: ['describe', 'context', 'suite'],
    itLike: ['it', 'specify', 'test']
}

export function retrieveDebuggableTokens(script: string) {
    let tokens = esprima.tokenize(script, { loc: true, range: true });
    let describeTokens = tokens
        .filter(t => t.type === 'Identifier')
        .filter(t => knownIdentifiers.describeLike.some(e => e === t.value));
    let itTokens = tokens
        .filter(t => t.type === 'Identifier')
        .filter(t => knownIdentifiers.itLike.some(e => e === t.value));
    return { describeTokens, itTokens }
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

export function isStricltyInside(child: Node, parent: Node): boolean {
    return child.range[0] > parent.range[0] && child.range[1] < parent.range[1];
}

export function isInside(child: Node, parent: Node): boolean {
    return child.range[0] >= parent.range[0] && child.range[1] <= parent.range[1];
}

/** Should be used on arrays of nodes where no two nodes have coinciding range (same range[0] 
 * __or__ same range[1]) 
 * 
 * @returns {any[]} an array, starting with node, and with parent nodes following from closest
 * to largest
 * */
export function getParents(node: Node, nodes: Node[]): Node[] {
    let parents = nodes.filter(p => isStricltyInside(node, p));
    return [node, ...parents.sort((n, m) => m.range[0] - n.range[0])];
}

export function extractName(itOrDescribeLikeProbably: Node, wholeTokenList: Node[]): string {
    let name = "";
    let firstArg = (itOrDescribeLikeProbably as any)?.arguments?.[0]
    if (firstArg) {
        if (firstArg.type === 'Literal') {
            if (typeof firstArg.value === 'string') {
                name = firstArg.value;
            }
        }
        else {
            let stringParts: string[] = wholeTokenList
                .filter(t => isInside(t, firstArg))
                .filter(t => t.type === 'String')
                .map(t=> (t as any).value.substring(1, (t as any).value.length - 1));

            name = stringParts.join(' ');
        }
    }
    return name;
}