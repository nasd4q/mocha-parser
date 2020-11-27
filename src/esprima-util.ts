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
                .map(t => (t as any).value.substring(1, (t as any).value.length - 1));

            name = stringParts.join(' ');
        }
    }
    return name;
}

export interface Token {
    type: string;
    value: string;
}

export function areSameToken(t1: Token, t2: Token): boolean {
    return t1.type === t2.type && t1.value === t2.value;
}

export interface IndexMapping {
    sourceIndex: number,
    targetIndex: number,
}

export interface PossibleIndexMappings {
    sourceIndex: number,
    targetIndexes: number[]
}

/**
 * The goal is to get a map that allows, given a token from the 'source' (an index
 * referring to a token from the source list) to get
 * its 'equivalent' inside the target list 
 * example :    source = t1, t2, t3, t4, t5, t1Bis, t7, t8
 *                  where t1 and t1Bis are 'same token' (`function areSameToken(...)`)
 *              target = t1', t3', t4', t1Bis', t8
 * 
 * then tokenMap includes {0,0}, {2,1} {3,2} {5,3} {7,4} 
 *             
 * 
 * @param source list of tokens in source file (say ts file)
 * @param target list of tokens in target file (say output of basic transpiling into js)
 */
export function tokenMap(source: Token[], target: Token[]): IndexMapping[] {
    /* let res: IndexMapping[] = [];

    
    let intermediateRes: PossibleIndexMappings[] = [];
    source.forEach((tSource,iSource)=>{
        let matchingTargetIndexes = []:
        target.forEach((tTarget,iTarget)=>{
            if (areSameToken(tSource, tTarget)) {
                matchingTargetIndexes.push(iTarget);
            }
        })
        if (matchingTargetIndexes.length>0) {
            intermediateRes.push({sourceIndex: iSource, targetIndexes: matchingTargetIndexes});
        }
    });

    return res; */
    return undefined;
}

export function eraseToken(script: string, token: Token): string {
    let first = (token as any).range[0];
    let last = (token as any).range[1];
    script = script.substring(0, first) + " ".repeat(last - first) + script.substring(last, script.length);
    return script
}

/**
 * Example tokens: 'as, 'any, '[', ']' et ')'
 *      -> filter out last parenthesis cause single
 *      and return 'as, 'any, '[', ']'
 * 
 * CAUTION items might (will) be shuffled : all non puctuator first then all punctuators
 * starting with those able to match first....
 * 
 * @param tokens 
 */
export function parityFilter(tokens: Token[]): Token[] {
    let sensitivePairs = [['<', '>'], ['(', ')'], ['{', '}'], ['[', ']']];
    let sensitive = ['<', '>', '(', ')', '{', '}', '[', ']'];
    let returnedTokens: Token[] = tokens.filter(t => t.type !== 'Punctuator' ||
        !sensitive.some(el => el === t.value));
    let sensitiveTokens = tokens.filter(t=>t.type === 'Punctuator' &&
        sensitive.some(el => el === t.value))
    
    let hope = true
    while (hope) {
        hope = false;
        for (let i = 0; i < sensitiveTokens.length - 1; i++) {
            if (sensitivePairs.some(p => p[0] ===sensitiveTokens[i].value &&
                p[1] ===sensitiveTokens[i+1].value)) {
                    returnedTokens.push(sensitiveTokens[i]);
                    returnedTokens.push(sensitiveTokens[i+1]);
                    sensitiveTokens = sensitiveTokens.filter((s,j)=>j!==i && j !== i+1);
                    hope = true;
                }
        }
    }
    return returnedTokens;
}