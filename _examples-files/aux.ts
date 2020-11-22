import * as fs from 'fs';

const sample1Path = __dirname + '/sample1.test.js';
const sample2Path = __dirname + '/sample2.test.js';
const sample3Path = __dirname + '/sample3.test.js';
const sample4Path = __dirname + '/sample4.test.js';
const sample5Path = __dirname + '/sample5.txt';




export const readFileFunc = (path: string) => {
    return (() => {
        let p: Promise<string> = new Promise(res => {
            fs.readFile(path, (err, data) => {
                res(data.toString());
            })
        });
        return p;
    });
}

export const sample1: () => Promise<string> = readFileFunc(sample1Path);
export const sample2: () => Promise<string> = readFileFunc(sample2Path);
export const sample3: () => Promise<string> = readFileFunc(sample3Path);
export const sample4: () => Promise<string> = readFileFunc(sample4Path);
export const sample5: () => Promise<string> = readFileFunc(sample5Path);