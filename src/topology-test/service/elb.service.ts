import { Injectable } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';
import { getD2Template, writeD2Output, replaceValue } from '@/func';

interface Subnet {
  name: string;
  cidr: string;
}

interface AZ {
  name: string;
  externalSubnets: Subnet[];
  internalSubnets: Subnet[];
}

interface ELB {
  vpcName: string;
  availabilityZones: AZ[];
}

@Injectable()
export class ELBService {
  updateELBTemplate(): void {
    const elbJson: ELB[] = this.getELBData();
    elbJson.forEach((elb: ELB, idx: number) => {
      const { vpcName, availabilityZones } = elb;

      availabilityZones.forEach((az: AZ, idx: number) => {
        let updatedVars = this.updateVars(az); // subnet
        updatedVars += `  vpc-name: ${vpcName} \n`; // vpcName
        updatedVars += `  az-name${idx + 1}: ${az['name']} \n`; // azName
        // console.log(updatedVars, idx);
        // console.log('=====================================');
      });
    });

    // update-[primary/secondary]-subnet

    // update-links-[primary/secondary]
  }

  private getELBData() {
    try {
      const elbData = fs.readFileSync(
        join(__dirname, '../../data/elb.json'),
        'utf8',
      );
      return JSON.parse(elbData);
    } catch (error) {
      console.error(`error = `, error);
      return null;
    }
  }

  private updateVars(az: AZ) {
    let vars = '';

    az['externalSubnets'].forEach((subnet: Subnet, subExNum: number) => {
      vars += `  subnet-external${subExNum + 1}: ${subnet['cidr']} \n`;
    });

    az['internalSubnets'].forEach((subnet: Subnet, subInNum: number) => {
      vars += `  subnet-internal${subInNum + 1}: ${subnet['cidr']} \n`;
    });
    return vars;
  }

  private updateSubnet(az: AZ) {
    // subnet-external
    let externalSubnet = '';
    az['externalSubnets'].forEach((subnet: Subnet, subExNum: number) => {
      externalSubnet += `  subnet-external${subExNum + 1} \n`;
    });
  }
}
