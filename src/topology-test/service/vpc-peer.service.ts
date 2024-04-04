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

  /**
   * myRegion에 VPC 정보 업데이트 후
   * JSON데이터에서 peering정보를 받아서 region 정보에 맞게 업데이트 해주면 되는데,
   * 1. 우선 myRegions에서 peering 중인걸 받아서 이건 바로 link update하면 됨
   *  -> peerings > myRegions['id'] : peer id
   *  -> peerings > myRegions > peeredVpc['name' & 'cidr'] : vpc info
   * 2. otherRegions의 경우엔 otherRegions요소 중 peeredVpc['region']이
   */
  private updateMyRegionInfo(VPCs: VPC[], d2String: string) {
    /**
     * myRegion에 VPC 정보 업데이트 후
     * 해당 VPC에서 peerings['myRegions'] > id & peeredVpc['name' & 'cidr'] 정보를 받아서 해당 peeredVpc도 box-xx로 추가해줘야함. 이후 이 두개를 Link로 연결
     */
    let myRegionInfo = '';
    VPCs.forEach((vpc, idx) => {
      myRegionInfo += `  box-${vpc['id']}.class: icon-vpc \n`;
      myRegionInfo += `  box-${vpc['id']}: "" { \n`;
      myRegionInfo += `    label: "${vpc['name']} ${vpc['cidr']}" \n`;
      // if (vpc['name'].length) {
      // } else {
      //   myRegionInfo += `    label: "${vpc['cidr']}" \n`;
      // }
      myRegionInfo += `  } \n\n`;

      vpc['peerings']['myRegions'].forEach((peer, peerIdx) => {
        myRegionInfo += `  box-${peer['vpc']['id']}.class: icon-vpc \n`;
        myRegionInfo += `  box-${peer['vpc']['id']}: "" { \n`;
        myRegionInfo += `    label: "${peer['vpc']['name']} ${peer['vpc']['cidr']}" \n`;
        myRegionInfo += `  } \n\n`;
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
