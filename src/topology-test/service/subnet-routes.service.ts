import { Injectable } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';
import { getD2Template, replaceValue, writeD2Output } from '@/func';

interface RouteInfo {
  routetableid: string;
  gatewayid: string;
  natgatewayid: string;
}

interface Subnet {
  subnetId: string;
  cidrBlock: string;
  routeInfo: RouteInfo[];
}

interface Data {
  availabilityzoneid: string;
  availabilityzone: string;
  subnets: Subnet[];
}

interface SubnetRoutes {
  vpcId: string;
  data: Data[];
}

@Injectable()
export class SubnetRoutesService {
  updateSubnetRoutesTemplate(): string {
    const subnetRoutesJson: SubnetRoutes[] = this.getSubnetRoutesData();
    const filename = 'subnet-routes';

    // 1. vpc별로 d2 output 생성.
    let result = '';

    subnetRoutesJson.forEach((subnetRoutes: SubnetRoutes, idx: number) => {
      const { vpcId, data } = subnetRoutes;

      // update vars
      const d2Template = getD2Template(filename);

      const { resultString, routetableIds, gatewayIds, natgatewayIds } =
        this.updateVars(data);
      const subnetData = this.classifySubnetAsAz(data);
      const { routetable, gateway, natgateway } = this.updateRouteInfo(
        routetableIds,
        gatewayIds,
        natgatewayIds,
      );

      const relation = this.updateSubnetRelation(data);

      const updatedVars = replaceValue(
        d2Template,
        '"{{update-vars}}"',
        resultString,
      );

      const updatedSubnet = replaceValue(
        updatedVars,
        '"{{update-subnets}}"',
        subnetData,
      );
      const updatedRoutetable = replaceValue(
        updatedSubnet,
        '"{{update-routetables}}"',
        routetable,
      );
      const updatedGateway = replaceValue(
        updatedRoutetable,
        '"{{update-gateways}}"',
        gateway,
      );
      const updatedNatGateway = replaceValue(
        updatedGateway,
        '"{{update-natgateways}}"',
        natgateway,
      );
      const updatedRelationship = replaceValue(
        updatedNatGateway,
        '"{{update-relationship}}"',
        relation,
      );
      const updatedVpcId = replaceValue(
        updatedRelationship,
        '"{{update-vpc-id}}"',
        vpcId,
      );

      result += updatedVpcId;
      writeD2Output(`${filename}-${vpcId}`, updatedVpcId);
    });
    return result;
  }

  private getSubnetRoutesData() {
    try {
      const subnetRoutesData = fs.readFileSync(
        join(__dirname, '../../data/subnet-routes.json'),
        'utf8',
      );
      return JSON.parse(subnetRoutesData);
    } catch (error) {
      console.error(`error = `, error);
      return null;
    }
  }

  // updateVars
  private updateVars(data: Data[]) {
    const routetableIds = new Set();
    const gatewayIds = new Set();
    const natgatewayIds = new Set();

    let resultString = '';
    data.forEach((d: Data, azIdx: number) => {
      const azKey = `\taz-${azIdx + 1}`;
      resultString += `${azKey}: ${d['availabilityzoneid']} \n`;

      d['subnets'].forEach((subnet: Subnet, subnetIdx: number) => {
        const subnetKey = `subnet${azIdx + 1}-${subnetIdx + 1}`;
        resultString += `  ${subnetKey}: ${subnet['cidrBlock']}\n`;

        subnet['routeInfo'].forEach((routeInfo: RouteInfo) => {
          if (routeInfo['routetableid'])
            routetableIds.add(routeInfo['routetableid']);
          if (routeInfo['gatewayid']) gatewayIds.add(routeInfo['gatewayid']);
          if (routeInfo['natgatewayid'])
            natgatewayIds.add(routeInfo['natgatewayid']);
        });
      });
    });

    routetableIds.forEach((id) => {
      if (id) resultString += `  routetableid: ${id}\n`;
    });
    gatewayIds.forEach((id) => {
      if (id) resultString += `  igatewayid: ${id}\n`;
    });
    natgatewayIds.forEach((id) => {
      if (id) resultString += `  natgatewayid: ${id}\n\n`;
    });

    return { resultString, routetableIds, gatewayIds, natgatewayIds };
  }

  // az 별로 subnet 분류
  private classifySubnetAsAz(data: Data[]) {
    let resultString = '';
    data.forEach((d: Data, idx: number) => {
      //
      resultString += `  box-az${idx + 1}.class: box-left\n`;
      resultString += `  box-az${idx + 1}: "AZ-${idx + 1}" {\n`;
      resultString += `    style.font-size: 12\n`;

      // subnet
      d['subnets'].forEach((subnet: Subnet, i: number) => {
        resultString += `    subnet${idx + 1}-${i + 1}.class: box-subnet\n`;
        resultString += `    subnet${idx + 1}-${i + 1}: "" {\n`;
        resultString += `      label: \${subnet${idx + 1}-${i + 1}}\ \n`;
        resultString += `    }\n`;
      });
      resultString += `  }\n\n`;
    });
    return resultString;
  }

  // routeInfo
  private updateRouteInfo(
    routetableids: any,
    gatewayids: any,
    natgatewayids: any,
  ) {
    let routetable = '';
    let gateway = '';
    let natgateway = '';

    if (routetableids.size > 0) {
      routetable += `  routetable1.class: icon-routetable\n`;
      routetable += `  routetable1: "" {\n`;
      routetable += `    label: \${routetableid}\ \n`;
      routetable += `  }\n`;
    }

    if (gatewayids.size > 0) {
      gateway += `  igatewayid.class: icon-gateway \n`;
      gateway += `  igatewayid: "" {\n`;
      gateway += `    label: \${igatewayid}\ \n`;
      gateway += `    icon: \${icon-gateway}\ \n`;
      gateway += `  }\n\n`;
    }

    if (natgatewayids.size > 0) {
      natgateway += `  natgatewayid.class: icon-gateway \n`;
      natgateway += `  natgatewayid: "" {\n`;
      natgateway += `    label: \${natgatewayid}\ \n`;
      natgateway += `    icon: \${icon-nat-gateway}\ \n`;
      natgateway += `  }\n\n`;
    }

    return { routetable, gateway, natgateway };
  }

  private updateSubnetRelation(data: Data[]) {
    let relation = '';
    data.forEach((d: Data, idx: number) => {
      d['subnets'].forEach((subnet: Subnet, subnetIdx: number) => {
        subnet['routeInfo'].forEach((routeInfo: RouteInfo) => {
          if (routeInfo['natgatewayid'] && routeInfo['routetableid']) {
            relation += `vpc.box-subnets.box-az${idx + 1}.subnet${idx + 1}-${
              subnetIdx + 1
            } -> vpc.box-routetables.routetable1 -> vpc.box-gateways.natgatewayid: { \n`;
            // relation += `  style.animated: true \n`
            relation += `  style.opacity: 0.8 \n`;
            relation += `  style.stroke: blue \n`;
            relation += `  style.stroke-dash: 2 \n`;
            relation += `}\n\n`;
          }

          if (routeInfo['gatewayid'] && routeInfo['routetableid']) {
            relation += `vpc.box-subnets.box-az${idx + 1}.subnet${idx + 1}-${
              subnetIdx + 1
            } -> vpc.box-routetables.routetable1 -> vpc.box-gateways.igatewayid: { \n`;
            // relation += `  style.animated: true \n`;
            relation += `  style.opacity: 0.8 \n`;
            relation += `  style.stroke: blue \n`;
            relation += `  style.stroke-dash: 2 \n`;
            relation += `}\n\n`;
          }
        });
      });
    });
    return relation;
  }
}
