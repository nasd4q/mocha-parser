const { rejects } = require('assert');
const esprima = require('esprima');
const fs = require('fs');

const sample1Path = '/Users/apple/dev/learning/playing-with-esprima/examples-files/sample1.test.js';
const sample2Path = '/Users/apple/dev/learning/playing-with-esprima/examples-files/sample2.test.js';


let pM = esprima.parseModule(fs.readFileSync(sample1Path).toString());
let pS = esprima.parseScript(fs.readFileSync(sample2Path).toString(), { range: true, tokens: true, loc: true });
let tokens = esprima.tokenize(fs.readFileSync(sample2Path).toString(), { range: true, loc: true });


console.log(esprima.version);

let runsAbles = [];
let inspectArray = pM.body;
let identifiers = ['describe', 'it'];

function listAllNodes(nodesToInspect) {
    let res = [];
    let rej = [];
    while (nodesToInspect.length > 0) {
        let inspectedNode = nodesToInspect.shift();
        if (inspectedNode) {
            if (inspectedNode.type) {
                res.push(inspectedNode);
            } else {
                rej.push(inspectedNode);
            }

            nodesToInspect.push(...Object.values(inspectedNode).filter(n => typeof n === 'object'));
        }
        nodesToInspect = nodesToInspect
            .filter(nTI => {
                let res = null;
                try {
                    res = Object.values(nTI);
                } catch (err) {}
                return res && res.length > 0;
            })
    }
    return res;
}

function extractRunsAble(nodesToInspect) {
    let res = [];
    while (nodesToInspect.length > 0) {
        let root = nodesToInspect.shift();
        if (root.body && root.body.length > 0)
            for (const n of root.body.filter(n => n.type === 'ExpressionStatement')) {
                if (n.expression.type === 'CallExpression') {
                    let callExp = n.expression;
                    if (callExp.callee.type === 'Identifier' && identifiers.includes(callExp.callee.name)) {
                        res.push(callExp);
                    }
                    for (const fExp of callExp.arguments.filter(t => t.type === 'FunctionExpression')) {
                        if (fExp.body.type === 'BlockStatement') {
                            nodesToInspect.push(fExp.body);
                        }
                    }
                }
            }
    }
    return res;
}

let r = extractRunsAble([pS]);

let nodes = listAllNodes(pS.body);

let counts = {};
nodes.forEach(n => {
    if (counts[n.type] != null) {
        counts[n.type]++;
    } else {
        counts[n.type] = 1;
    }
})

let s = r.map(t => { return { identifier: t.callee.name, name: t.arguments[0].value }; })

let moreThanOneLineNodes = nodes.filter(n => n.type !== 'Identifier').filter(n => n.loc.start.line < n.loc.end.line)

moreThanOneLineNodes = moreThanOneLineNodes.filter((n, ni) => {
    return !(n.type === 'BlockStatement' && moreThanOneLineNodes.some((m, mi) => areSame(n, m) && ni !== mi))
});

function isInside(child, parent) {
    return child.loc.start.line >= parent.loc.start.line && child.loc.end.line <= parent.loc.end.line;
}

function areSame(child, parent) {
    return child.loc.start.line === parent.loc.start.line && child.loc.end.line === parent.loc.end.line;
}

moreThanOneLineNodes.forEach((n, ni) => moreThanOneLineNodes.forEach((m, mi) => {
    if (areSame(m, n) && ni < mi) {
        console.log('areSame');
        console.log(m, n);
    }
}));

let debuggable = moreThanOneLineNodes
    .filter(n => n.type === 'CallExpression' && identifiers.includes(n.callee.name));



console.log(r);

//ALGO:
//on prend nodes n ( de array pM.body) qui sont type: 'ExpressionStatement'
// si e:n.expression :  e.type CallExpression, avec 
//   c    e.callee : c.type 'Identifier' c.name 'describe'
// alors e.arguments[].filter(a=>a.type = 'FunctionExpression
//          alors                      a.body 'BlockStatement'
// alors on recommence avec a.body.body

//