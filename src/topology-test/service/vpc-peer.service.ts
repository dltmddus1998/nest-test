import { Injectable } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';
import {
  getJSONData,
  getD2Template,
  writeD2Output,
  replaceValue,
} from '@/func';

interface PeeredVPC {
  id: string;
  name: string;
  vpc: {
    id: string;
    name: string;
    cidr: string;
  };
}

interface VPC {
  id: string;
  name: string;
  cidr: string;
  peerings: {
    myRegions: PeeredVPC[];
    otherRegions: {
      region: string;
      peeringInfo: PeeredVPC[];
    }[];
  };
}

interface VPCPeer {
  regionName: string;
  region: string;
  VPCs: VPC[];
}

@Injectable()
export class VpcPeerService {
  updateVpcPeerTemplate(): any {
    const vpcPeerData: VPCPeer = getJSONData('vpc-peer');
    const d2Template: string = getD2Template('vpc-peer');
    const { region, VPCs } = vpcPeerData;

    let result;

    const updatedMyRegionLabel = this.updateMyRegionLabel(region, d2Template);

    if (VPCs.length) {
      const updatedMyRegionInfo = this.updateMyRegionInfo(
        VPCs,
        updatedMyRegionLabel,
      );
      result += updatedMyRegionInfo;
    }

    return result;
  }

  // TODO: myregion label
  private updateMyRegionLabel(region: string, d2String: string): any {
    return replaceValue(d2String, '"{{myRegion}}"', region);
  }

  private updateMyRegionInfo(VPCs: VPC[], d2String: string) {
    let myRegionInfo = '';
    VPCs.forEach((vpc, idx) => {
      myRegionInfo += `  box-${vpc['id']}.class: icon-vpc \n`;
      myRegionInfo += `  box-${vpc['id']}: "" { \n`;
      myRegionInfo += `    label: "${vpc['name']} ${vpc['cidr']}" \n`;

      myRegionInfo += `  } \n\n`;

      vpc['peerings']['myRegions'].forEach((peer, peerIdx) => {
        // update link
        myRegionInfo += `  box-${vpc['id']} <-> box-${peer['vpc']['id']}: ${peer['name']} \n`;
      });
    });

    return replaceValue(d2String, '"{{update-myRegion}}"', myRegionInfo);
  }

  // TODO: "{{update-links}}"
  private updateLinks(): any {
    return;
  }
}
