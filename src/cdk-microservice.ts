import { awscdk } from "projen";

export interface CdkMicroserviceOptions extends awscdk.AwsCdkTypeScriptAppOptions {}

export class CdkMicroservice extends awscdk.AwsCdkTypeScriptApp {
  constructor(options: CdkMicroserviceOptions) {
    super({
      licensed: false,
      prettier: true,
      gitignore: [".idea"],
      prettierOptions: {
        settings: {
          printWidth: 120,
        },
      },
      release: false,
      ...options,
      sampleCode: false,
    });
  }
}
