import { Injectable } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';
import {
  getJSONData,
  getD2Template,
  writeD2Output,
  replaceValue,
} from '@/func';

interface EC2Resources {
  region: string;
  instances: {
    running: number;
    stopped: number;
  };
  vpcs: {
    total: number;
  };
  subnets: {
    total: number;
  };
  natGateways: {
    total: number;
  };
  internetGateways: {
    attached: number;
    notAttached: number;
  };
  eips: {
    associated: number;
    notAssociated: number;
  };
}

@Injectable()
export class Ec2ResourcesService {
  updateEc2ResourcesTemplate(): any {
    const ec2ResourcesData: EC2Resources[] = getJSONData('ec2-resources');
    const d2Template: string = getD2Template('ec2-resources');

    ec2ResourcesData.forEach((ec2Resource: EC2Resources, idx: number) => {
      const updatedRegionLabel = this.updateRegionLabel(
        ec2Resource,
        d2Template,
      );

      const updatedNumRunningInstances = this.updateTargetNum(
        ec2Resource,
        updatedRegionLabel,
        'instances',
        'running',
      );

      const updatedNumStoppedInstances = this.updateTargetNum(
        ec2Resource,
        updatedNumRunningInstances,
        'instances',
        'stopped',
      );

      const updatedNumTotalVpcs = this.updateTargetNum(
        ec2Resource,
        updatedNumStoppedInstances,
        'vpcs',
        'total',
      );

      const updatedNumTotalSubnets = this.updateTargetNum(
        ec2Resource,
        updatedNumTotalVpcs,
        'subnets',
        'total',
      );

      const updatedNumTotalNatGateways = this.updateTargetNum(
        ec2Resource,
        updatedNumTotalSubnets,
        'natGateways',
        'total',
      );

      const updatedNumAttachedInternetGateways = this.updateTargetNum(
        ec2Resource,
        updatedNumTotalNatGateways,
        'internetGateways',
        'attached',
      );

      const updatedNumNotAttachedInternetGateways = this.updateTargetNum(
        ec2Resource,
        updatedNumAttachedInternetGateways,
        'internetGateways',
        'notAttached',
      );

      const updatedNumAssociatedEips = this.updateTargetNum(
        ec2Resource,
        updatedNumNotAttachedInternetGateways,
        'eips',
        'associated',
      );

      const updatedNumNotAssociatedEips = this.updateTargetNum(
        ec2Resource,
        updatedNumAssociatedEips,
        'eips',
        'notAssociated',
      );

      writeD2Output(
        `ec2-resources-${ec2Resource.region}`,
        updatedNumNotAssociatedEips,
      );
    });
  }

  private getEC2ResourcesData() {
    try {
      const ec2ResourcesData = fs.readFileSync(
        join(__dirname, '../../data/ec2-resources.json'),
        'utf8',
      );

      return JSON.parse(ec2ResourcesData);
    } catch (err) {
      console.error(err);
      return;
    }
  }

  private updateRegionLabel(ec2Resource: EC2Resources, d2String: string) {
    return replaceValue(d2String, '{{region-label}}', ec2Resource['region']);
  }

  private updateTargetNum(
    ec2Resource: EC2Resources,
    d2String: string,
    target: string,
    status?: string,
  ) {
    return replaceValue(
      d2String,
      `{{num-${status}-${target}}}`,
      String(ec2Resource[target][status]),
    );
  }
}
