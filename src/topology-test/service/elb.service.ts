import { Injectable } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';
import { getD2Template, writeD2Output, replaceValue } from '@/func';

interface ELBPerVPC {
  vpcId: string;
  internetGatewayId: string[];
  availabilityZones: {
    availabilityZone: string;
    subnets: {
      subnetId: string;
    }[];
  }[];
  elbs: {
    elbId: string;
    vpcId: string;
    subnets: string[];
  }[];
}

interface Datas {
  subnetDatas: {
    subnetId: string;
    vpcId: string;
    isPublic: boolean;
    cidrblock: string;
  }[];
  elbDatas: {
    elbId: string;
    elbName: string;
    elbType: 'internet-facing' | 'internal';
    vpcId: string;
  }[];
}

@Injectable()
export class ELBService {
  updateELBTemplate(): void {
    const elbJson: ELBPerVPC[] = this.getELBData();
    const datas: Datas = this.getDatas();
    const d2Template: string = getD2Template('elb');
    const azWithSubnets = [];

    // update-vars
    elbJson.forEach((elbPerVPC: ELBPerVPC, idx: number) => {
      const updatedVars = this.updateVars(elbPerVPC, datas);
      console.log(updatedVars);
      console.log('----------------------');
    });
  }

  private getELBData() {
    try {
      const elbData = fs.readFileSync(
        join(__dirname, '../../data/elb/elb.json'),
        'utf8',
      );

      return JSON.parse(elbData);
    } catch (error) {
      console.error(`error = `, error);
      return null;
    }
  }

  private getDatas() {
    try {
      const datas = fs.readFileSync(
        join(__dirname, '../../data/elb/datas.json'),
        'utf8',
      );
      return JSON.parse(datas);
    } catch (error) {
      console.error(`error = `, error);
      return null;
    }
  }

  private updateVars(elbPerVPC: ELBPerVPC, datas: Datas) {
    let result = '';
    // vpc id
    result += `  vpc-id: ${elbPerVPC['vpcId']}\n`;

    if (
      Array.isArray(elbPerVPC['availabilityZones']) &&
      elbPerVPC.availabilityZones.length
    ) {
      elbPerVPC['availabilityZones'].forEach((az, azIdx) => {
        // AZ name
        result += `  az-name${azIdx + 1}: ${az['availabilityZone']} \n`;
        // subnet cidr
        if (az['subnets']) {
          if (Array.isArray(az['subnets']) && az['subnets'].length) {
            az['subnets'].forEach((subnet, subnetIdx) => {
              // 이제 여기서 datas에서 가져온 subnetDatas와 매핑
              datas['subnetDatas'].forEach((subnetData) => {
                if (subnet['subnetId'] === subnetData['subnetId']) {
                  // subnetId: subnet-az1-1 형식 지정
                  result += `  subnet-az${azIdx + 1}-${subnetIdx + 1}: ${
                    subnetData['cidrblock']
                  }\n`;
                }
              });
              // result += `  subnet${subnetIdx + 1}: `
            });
          }
        }
      });

      // elb
      if (Array.isArray(elbPerVPC['elbs']) && elbPerVPC['elbs'].length) {
        elbPerVPC['elbs'].forEach((elb, elbIdx) => {
          // 매핑
          datas['elbDatas'].forEach((elbData) => {
            if (elb['elbId'] === elbData['elbId']) {
              if (elbData['elbType'] === 'internet-facing') {
                result += `  elb-external${elbIdx + 1}: `;
              }
            }
          });
        });
      }
    }

    return result;
  }

  // private mapWithDatas(
  //   subnetDatas: {
  //     subnetId: string;
  //     vpcId: string;
  //     isPublic: boolean;
  //     cidrblock: string;
  //   }[],
  // ) {
  //   // datas에서 가져온 subnetDatas와 elbDatas를 매핑
  //   subnetDatas.forEach((subnetData) => {});
  // }
}
