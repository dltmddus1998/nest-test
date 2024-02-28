import { Injectable } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';
import { getD2Template, writeD2Output, replaceValue } from '@/func';

interface Region {
  regionsList: string[];
}

@Injectable()
export class RegionService {
  updateRegionTemplate(): string {
    const regionJson: Region = this.getRegionData();
    const { regionsList } = regionJson;
    const filename = 'region';

    const d2Template = getD2Template(filename);

    // data <-> d2 "{{}}" values
    const { regionPosData, cnt } = this.setPosition(regionsList);
    const pins = this.setPin(cnt);

    // update d2
    const updatedVars = replaceValue(
      d2Template,
      '"{{update-vars}}"',
      regionPosData,
    );
    const updatedPins = replaceValue(updatedVars, '"{{update-regions}}"', pins);

    writeD2Output(filename, updatedPins);
    return updatedPins;
  }

  private getRegionData() {
    try {
      const regionData = fs.readFileSync(
        join(__dirname, '../../data/region.json'),
        'utf8',
      );
      return JSON.parse(regionData);
    } catch (error) {
      console.error(`error = `, error);
      return null;
    }
  }

  private setPosition(regionList: string[]) {
    let regionPosData = '';
    let cnt = 0;
    regionList.forEach((region: string, idx: number) => {
      switch (region) {
        case 'N. Virginia':
          regionPosData += `region${idx + 1}: ${region}\n`;
          regionPosData += `  top-region${idx + 1}: 272\n`;
          regionPosData += `  left-region${idx + 1}: 180\n\n`;
          cnt++;
          break;
        case 'Seoul':
          regionPosData += `region${idx + 1}: ${region}\n`;
          regionPosData += `  top-region${idx + 1}: 287\n`;
          regionPosData += `  left-region${idx + 1}: 782\n`;
          cnt++;
          break;
        default:
          break;
      }
    });
    return { regionPosData, cnt };
  }

  private setPin(cnt: number) {
    let pins = '';
    for (let i = 0; i < cnt; i++) {
      pins += `region${i + 1}.class: pin\n`;
      pins += `region${i + 1}: {\n`;
      pins += `  label: \${region${i + 1}}\ \n`;
      pins += `  top: \${top-region${i + 1}}\ \n`;
      pins += `  left: \${left-region${i + 1}}\ \n`;
      pins += `}\n\n`;
    }

    return pins;
  }
}
