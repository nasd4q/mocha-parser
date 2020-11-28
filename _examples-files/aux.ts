import * as fs from 'fs';

const sample1Path = __dirname + '/sample1.test.js';
const sample2Path = __dirname + '/sample2.test.js';
const sample3Path = __dirname + '/sample3.test.js';
const sample4Path = __dirname + '/sample4.test.js';
const sample5Path = __dirname + '/sample5.txt';
const sample6Path = __dirname + '/sample6.txt';
const sample7Path = __dirname + '/sample7.txt';
const sample8Path = __dirname + '/sample8.txt';
const sample9Path = __dirname + '/sample9.txt';
const sample10Path = __dirname + '/sample10.txt';





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
export const sample6: () => Promise<string> = readFileFunc(sample6Path);
export const sample7: () => Promise<string> = readFileFunc(sample7Path);
export const sample8: () => Promise<string> = readFileFunc(sample8Path);
export const sample9: () => Promise<string> = readFileFunc(sample9Path);
export const sample10: () => Promise<string> = readFileFunc(sample10Path);