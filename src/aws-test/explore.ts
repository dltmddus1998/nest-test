import {
  ResourceExplorer2Client,
  SearchCommand,
} from '@aws-sdk/client-resource-explorer-2';

export class Explorer {
  // constructor() {}

  async test() {
    const resourceExplorerClient = new ResourceExplorer2Client({
      region: 'ap-northeast-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const result: RegionalResources[] = [];

    const services = [
      { category: 'compute', types: ['ec2:instance', 'lambda:function'] },
      { category: 'storage', types: ['s3:bucket'] },
      { category: 'analytics', types: ['glue:database', 'athena:workgroup'] },
      { category: 'database', types: ['rds:db'] },
      { category: 'container', types: ['ecs:cluster', 'ecr:repository'] },
      {
        category: 'network',
        types: ['ec2:vpc', 'ec2:internet-gateway', 'apigateway:restapis'],
      },
    ];

    for (const service of services) {
      for (const type of service.types) {
        try {
          let NextToken = '';
          do {
            const command = new SearchCommand({
              QueryString: `resourcetype:${type}`,
              MaxResults: 100,
              ViewArn: process.env.AWS_RESOURCE_EXPLORER_VIEW_ARN,
              NextToken: NextToken === '' ? undefined : NextToken,
            });
            const response = await resourceExplorerClient.send(command);

            for (const resource of response.Resources) {
              let regionEntry = result.find((res) => res.region);
              if (!regionEntry) {
                regionEntry = new RegionalResources(resource.Region);
                result.push(regionEntry);
              }
              const resourceId = resource.Arn.split('/').pop();
              if (resourceId)
                regionEntry.addResource(
                  resource.ResourceType,
                  resourceId,
                  service.category,
                  type,
                );
            }
            NextToken = response.NextToken;
          } while (NextToken);
        } catch (error) {
          console.error(`error = `, error);
        }
      }
    }
    return result;
  }
}

class RegionalResources {
  region: string;
  categories: Category[];

  constructor(region: string) {
    this.region = region;
    this.categories = [];
  }

  addResource(
    resourceType: string,
    resourceId: string,
    categoryName: string,
    typeName: string,
  ) {
    let category = this.categories.find((cat) => cat.category === categoryName);
    if (!category) {
      category = new Category(categoryName);
      this.categories.push(category);
    }
    category.addResource(resourceType, resourceId, typeName);
  }
}

class Category {
  category: string;
  types: ResourceType[];

  constructor(category: string) {
    this.category = category;
    this.types = [];
  }

  addResource(resourceType: string, resourceId: string, typeName: string) {
    let type = this.types.find((t) => t.type === typeName);
    if (!type) {
      type = new ResourceType(typeName);
      this.types.push(type);
    }
    type.addData(resourceType, resourceId);
  }
}

class ResourceType {
  type: string;
  data: ResourceData[];
  count: number;

  constructor(type: string) {
    this.type = type;
    this.data = [];
    this.count = 0;
  }

  addData(resourceType: string, resourceId: string) {
    this.data.push(new ResourceData(resourceType, resourceId));
    this.count++;
  }
}

class ResourceData {
  resourceType: string;
  resourceId: string;

  constructor(resourceType: string, resourceId: string) {
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}
