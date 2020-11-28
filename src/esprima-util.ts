import * as esprima from 'esprima';
import { isValidTS, jsFromTs } from './is-valid-ts';

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

export interface RangedToken extends esprima.Token {
    range: [number, number];
    loc: LocationRange;
}

/**
 * Filters tokens (by `type `('Identifier')
 * and `value` [must be inside `knwowIdentifiers` - either 'describe', 'context' etc.
 * or 'it', 'test' etc.]), sorts them out and returns.
 * @param script 
 */
export function retrieveDebuggableTokens(script: string, tokens: RangedToken[]) {
    let describeTokens = (tokens
        .filter(t => t.type === 'Identifier')
        .filter(t => knownIdentifiers.describeLike.some(e => e === t.value)) as RangedToken[]);
    /* .filter(t=>{
        let indeedDebuggable = script.charAt((t as any).range[1])==='(';
        return indeedDebuggable;
    }) */
    let itTokens = (tokens
        .filter(t => t.type === 'Identifier')
        .filter(t => knownIdentifiers.itLike.some(e => e === t.value)) as RangedToken[]);
    /* .filter(t=>{
        let indeedDebuggable = script.charAt((t as any).range[1])==='(';
        return indeedDebuggable;
    }) */
    return { describeTokens, itTokens }
}

/**
 * 
 * @param t 
 * @param tokens 
 * 
 * Note : returns null if no following token found in list
 */
function nextToken(t: RangedToken, tokens: RangedToken[]) {
    let nextTokens = tokens
        .filter(u => u.range[0] >= t.range[1])
        .sort((u, v) => u.range[0] - v.range[0]);
    if (nextTokens.length < 1) {
        return null;
    }
    return nextTokens[0];
}

/**
 * Note : returns null only if not possible to find any spot where to stop and resulting
 * script would be at ease : that is all opening tokens have been orderly closed
 * 
 * Else returns a not null token.
 * 
 * @param t 
 * @param tokens should be those of valid TS script !
 * @param accumulation a string representing state of opened '(', '[' and ’{'
 * ex: '({(([' waiting to be closed
 */
function nextPossibleEndToken(t: RangedToken, tokens: RangedToken[], accumulation: string) {
    const pairs = [['(', ')'], ['{', '}'], ['[', ']']];
    function update(accumulation: string, t: RangedToken): string {
        if (!t) {
            return accumulation;
        }
        if (t.type === 'Punctuator') {
            if (pairs.some(p => p[0] === t.value)) {
                accumulation = accumulation + t.value;
            }
            if (pairs.some(p => p[1] === t.value)) {
                let matchingOpener = pairs.find(p => p[1] === t.value)[0];
                if (!accumulation.endsWith(matchingOpener)) {
                    throw new Error('Programmatic assumption broken : ' +
                        'met closing token but accumulation not ending with matching opener !');
                }
                accumulation = accumulation.slice(0, -1);
            }
        }
        return accumulation;
    }
    let candidateEndToken = nextToken(t, tokens);
    let updatedAccumulation = update(accumulation, candidateEndToken);
    while (updatedAccumulation.length > 0 && candidateEndToken) {
        candidateEndToken = nextToken(candidateEndToken, tokens);
        try {
            updatedAccumulation = update(updatedAccumulation, candidateEndToken);
        } catch (err) {
            if (err.message === 'Programmatic assumption broken : met closing token' +
                ' but accumulation not ending with matching opener !') {
                return null;
            } else {
                throw err;
            }
        }
        //DEBUG ONLY
        //console.log(JSON.stringify([candidateEndToken?.value, updatedAccumulation]));
    }
    if (updatedAccumulation.length > 0) {
        return null;
    }
    if (candidateEndToken === null) {
        throw new Error('Programmatic belief broken : it can go until candidateEndToken ' +
            'is null !');
    }
    return candidateEndToken;
}

function isOpeningParenthesis(t: Token): boolean {
    return t.type === 'Punctuator' && t.value === '(';
}

function isIndeedDebuggable(n: Node) {
    //TODO
    //console.log(n);
    return true;
}

function interludeNotAmountingToADebuggable(interlude: string): boolean {
    //TODO example /\s/.test(interlude)
    return false;
}



/**
 * Note : Returns `null` if it is found out this token does not mark the start of a debuggable
 * region !
 * 
 * @param t should be an identifier token for 'describe' or 'it' etc... ie 'debuggable'
 * @param script 
 * @param tokens 
 */
export function debuggableNodeFromToken(t: RangedToken, script: string, tokens: RangedToken[]): Node {
    let startIndex = t.range[0];
    let firstNextOpeningParenthesis = nextToken(t, tokens);
    while (firstNextOpeningParenthesis && !isOpeningParenthesis(firstNextOpeningParenthesis)) {
        firstNextOpeningParenthesis = nextToken(firstNextOpeningParenthesis, tokens);
    }
    if (!firstNextOpeningParenthesis) {
        //Fake alarm - this is not a debuggable ! : no following opening parenthesis
        return null;
    }
    let interlude = script.substring(t.range[0], firstNextOpeningParenthesis.range[0]);
    if (interludeNotAmountingToADebuggable(interlude)) {
        //Fake alarm - this is not a debuggable ! : something's not right in the substring
        //      between the describe or it token and the following opening parenthesis
        return null;
    }
    let accumulation = interlude.replace(/[^\]\[\)\}\(\{]/g, "") + "(";
    let candidateEndToken = nextPossibleEndToken(firstNextOpeningParenthesis, tokens, accumulation);
    while (candidateEndToken &&
        !isValidTS(script.substring(startIndex, candidateEndToken.range[1]))) {
        candidateEndToken = nextPossibleEndToken(candidateEndToken, tokens, "");;
    }
    if (!candidateEndToken) {
        //another case of fake alarm : impossible to extract region as
        //  valid ts
        return null;
    }

    //Now return as node 
    //1.use esprima to get node
    let jsScriptOfNode = jsFromTs(script.substring(startIndex, candidateEndToken.range[1]))
    let root = esprima.parseScript(jsScriptOfNode, { loc: true, range: true, tolerant: true })
    //console.log(root);
    let nodes = extractAllNodes(root);
    let candidateNodes = nodes.filter(n => n.range[0] === 0 && n.type === 'CallExpression');
    if (candidateNodes.length > 1) {
        console.log(candidateNodes);
        throw new Error('Programmatic assumption broken: Maximum one node will be found.');
    }
    if (candidateNodes.length < 1) {
        return null;
    }
    let node: Node = candidateNodes[0];
    //Check it is indeed debuggable 
    if (!isIndeedDebuggable(node)) {
        return null;
    }
    //2, tweak range and loc to match original script context
    node.range = [t.range[0], candidateEndToken.range[1]];
    node.loc = { start: t.loc.start, end: candidateEndToken.loc.end };
    return node;
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
        /* if (firstArg.type === 'Literal') {
            if (typeof firstArg.value === 'string') {
                name = firstArg.value;
            }
        }
        else { */
            let wholeList = extractAllNodes(firstArg);
            let strings = wholeList
                .filter(el=>el.type === 'Literal')
                .filter(el=>typeof (el as any)?.value === 'string')
                .map(el=> (el as any).value);


            name = strings.join(' ');
        /* } */
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
    let sensitiveTokens = tokens.filter(t => t.type === 'Punctuator' &&
        sensitive.some(el => el === t.value))

    let hope = true
    while (hope) {
        hope = false;
        for (let i = 0; i < sensitiveTokens.length - 1; i++) {
            if (sensitivePairs.some(p => p[0] === sensitiveTokens[i].value &&
                p[1] === sensitiveTokens[i + 1].value)) {
                returnedTokens.push(sensitiveTokens[i]);
                returnedTokens.push(sensitiveTokens[i + 1]);
                sensitiveTokens = sensitiveTokens.filter((s, j) => j !== i && j !== i + 1);
                hope = true;
            }
        }
    }
    return returnedTokens;
}