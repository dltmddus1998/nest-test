import * as fs from 'fs';
import { join } from 'path';

export function getD2Template(filename: string) {
  try {
    const d2Template = fs.readFileSync(
      join(__dirname, `../template/${filename}.d2`),
      'utf8',
    );
    return d2Template;
  } catch (error) {
    console.error(`error = `, error);
    return null;
  }
}

export function writeD2Output(filename: string, d2Output: string) {
  try {
    fs.writeFileSync(
      join(__dirname, `../template/update/${filename}-update.d2`),
      d2Output,
      {
        encoding: 'utf-8',
      },
    );
  } catch (error) {
    console.error(`error = `, error);
  }
}

export function replaceValue(preValue: string, value: string, data: string) {
  try {
    return preValue.replace(value, data);
  } catch (error) {
    console.error(`error = `, error);
  }
}
