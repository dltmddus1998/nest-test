import { Injectable } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';
import { getD2Template, writeD2Output, replaceValue } from '@/func';

interface ELBs {
  elbId: string;
  subnets: string[];
  elbName: string;
  elbType: 'internet-facing' | 'internal';
}

interface Subnet {
  subnetId: string;
  isPublic: boolean;
  cidrblock: string;
}

interface AZ {
  availabilityZone: string;
  subnets: Subnet[];
}

interface ELBPerVPC {
  vpcId: string;
  internetGatewayId: string[];
  availabilityZones: AZ[];
  elbs: ELBs[];
}

@Injectable()
export class ELBService {
  updateELBTemplate(): void {
    const elbJson: ELBPerVPC[] = this.getELBData();
    const d2Template = getD2Template('elb');
    const azWithSubnets = [];
    elbJson.forEach((elbPerVPC: ELBPerVPC, idx: number) => {
      // update-vars
      const vars = this.updateVars(elbPerVPC);
      console.log(vars);

      const { vpcId, internetGatewayId, availabilityZones, elbs }: ELBPerVPC =
        elbPerVPC;

      // az 생성
      // TODO: 이 토폴로지 특성상 az는 두개까지만 존재한다고 가정
      availabilityZones.forEach((az: AZ, azIdx: number) => {
        // console.log(az['availabilityZone'], idx);
        if (az['subnets']) {
          if (az['subnets'].length > 0) {
            azWithSubnets.push(az);
            // console.log(primaryAZ);
            // const secondaryAZ =
          }
        }
      });

      // az내 subnet 업데이트
      availabilityZones.forEach((az: AZ, idx: number) => {
        // console.log(subnets, az['availabilityZone']);
        // console.log('=====================================');

        if (idx === 0) {
          // update-primary-subnet
          const primarySubnets = this.updateSubnets(az);
          // console.log('primarySubnets= ', primarySubnets);
        } else if (idx === 1) {
          // update-secondary-subnet
          const secondarySubnets = this.updateSubnets(az);
          // console.log('secondarySubnets= ', secondarySubnets);
        }
      });

      elbs.forEach((elb: ELBs, idx: number) => {
        let isExternal = '';
        switch (elb['elbType']) {
          case 'internet-facing':
            isExternal += `Internet -> VPC.Box-ELB.elb-external`;
            break;
          case 'internal':
            break;
          default:
            break;
        }

        // subnet-internal: extra
      });
    });

    if (azWithSubnets.length > 1) {
      // update-primary-az
      azWithSubnets.forEach((az: AZ, azIdx: number) => {
        const primaryAZ = az['availabilityZone'];
        const updatedPrimaryAZ = replaceValue(
          d2Template,
          '{{update-primary-az}}',
          primaryAZ,
        );

        // console.log(updatedPrimaryAZ);
      });
    }

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

  private updateVars(elbPerVPc: ELBPerVPC) {
    let result = '';
    // elb-external n개
    // elb-internal n개
    elbPerVPc['elbs'].forEach((elb: ELBs, elbIdx: number) => {
      let elbExternal = '';
      let elbInternal = '';

      if (elb['elbType'] === 'internet-facing') {
        elbExternal += `    elb-external${elbIdx + 1}.class: elb-external \n`;
        elbExternal += `    elb-external${elbIdx + 1}: "" { \n`;
        elbExternal += `      label: ${elb['elbName']} \n`;
        elbExternal += `    }\n`;

        result += elbExternal;
      } else if (elb['elbType'] === 'internal') {
        elbInternal += `    elb-internal${elbIdx + 1}.class: elb-internal \n`;
        elbInternal += `    elb-internal${elbIdx + 1}: "" { \n`;
        elbInternal += `      label: ${elb['elbName']} \n`;
        elbInternal += `    }\n`;

        result += elbInternal;
      }
    });

    // availabilityZones 2개 고정.
    elbPerVPc['availabilityZones'].forEach((az: AZ, azIdx: number) => {
      let azName = '';
      if (az['subnets']) {
        if (az['subnets'].length > 0) {
          azName += `  az-name${azIdx + 1}.class: box \n`;

          result += azName;
        }
      }
    });

    // vpc-name
    result += `  vpc-id: ${elbPerVPc['vpcId']} \n`;
    return result;
  }

  // private updatePrimaryAZ(az: AZ) {
  //   let primaryAZ = '';

  //   primaryAZ += `  AZ-PRIMARY.class: box \n`;
  //   primaryAZ += `  AZ-PRIMARY: "" { \n`;
  //   primaryAZ += `    grid-columns: 1 \n`;
  //   primaryAZ += `    grid-gap: 20 \n`;
  //   primaryAZ += `    label: ${az['availabilityZone']} \n \n`;
  //   primaryAZ += `    "{{update-primary-subnet}}" \n \n`;
  //   primaryAZ += `  }\n`;
  //   // subnet
  //   // az['subnets'].forEach((subnet: Subnet, idx: number) => {
  //   //   if (idx < 2) {
  //   //     primaryAZ += `    subnet${idx + 1}.class: subnet \n`;
  //   //     primaryAZ += `    subnet${idx + 1}: "" { \n`;
  //   //     primaryAZ += `      label: ${subnet['cidrblock']} \n`;
  //   //     primaryAZ += `    }\n`;
  //   //   }
  //   // });

  //   return primaryAZ;
  // }

  private updateSubnets(az: AZ) {
    // az별 subnet 업데이트
    let subnets = '';

    if (Array.isArray(az['subnets'])) {
      az['subnets'].forEach((subnet: Subnet, idx: number) => {
        subnets += `    subnet${idx + 1}. class: subnet \n`;
        subnets += `    subnet${idx + 1}: "" { \n`;
        subnets += `      label: ${subnet['cidrblock']} \n`;
        subnets += `    }\n`;
      });
    }

    return subnets;
  }

  // private updateExternalELB(elb: ELBs) {}

  private updateInternalELB(elb: ELBs) {
    let internalELB = '';

    elb['subnets'].forEach((subnet: string, idx: number) => {
      internalELB += `    subnet-internal${idx + 1}. class: subnet-internal \n`;
      internalELB += `    subnet-internal${idx + 1}: "" { \n`;
      internalELB += `      label: ${subnet} \n`;
      internalELB += `    }\n`;
    });

    return internalELB;
  }

  private updateLinks(az: AZ) {
    // update-links-[primary/secondary]
    // let primaryLinks = '';
    // let secondaryLinks = '';
    // az[''];
  }
}
