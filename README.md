# mocha-parser

Parses mocha test scripts into programmatically usable objects.

## Example

```ts
import { MochaParser } from 'mocha-parser';

let sample = 
`import { expect } from 'chai';
import { sample1, sample2, sample3 } from '../_examples-files/aux';
import { MochaParser } from '../src/mocha-parser';


describe('Extract nodes', function() {
    this.timeout(0);

    it('Extracts three nodes out of sample1.test.js', async() => {
        let res = MochaParser.extractNodes(await sample1());
        expect(res.length).equals(3);
    });
});`;

let result = MochaParser.extractNodes(sample);

/* 
    result :    [
                    {
                        "range": {
                            "start": {
                                "line": 9,
                                "column": 4
                            },
                            "end": {
                                "line": 12,
                                "column": 6
                            }
                        },
                        "type": "it-like",
                        "name": "Extract nodes Extracts three nodes out of sample1.test.js"
                    },
                    {
                        "range": {
                            "start": {
                                "line": 6,
                                "column": 0
                            },
                            "end": {
                                "line": 13,
                                "column": 2
                            }
                        },
                        "type": "describe-like",
                        "name": "Extract nodes"
                    }
                ]
*/
```