import { awscdk, javascript } from "projen";
import { SampleCode } from "./sample-code";
import * as path from "path"; // eslint-disable-line

export interface CdkMicroserviceOptions extends awscdk.AwsCdkTypeScriptAppOptions {}

export class CdkMicroservice extends awscdk.AwsCdkTypeScriptApp {
  readonly projectName: string;

  constructor(options: CdkMicroserviceOptions) {
    super({
      licensed: false,
      gitignore: [".idea"],
      prettier: true,
      prettierOptions: {
        settings: {
          printWidth: 120,
        },
      },
      release: false,
      packageManager: javascript.NodePackageManager.NPM,
      projenrcTs: true,
      ...options,
      sampleCode: false,
      deps: ["source-map-support"],
    });

    this.projectName = path.basename(process.cwd());

    if (options.sampleCode ?? true) {
      new SampleCode(this);
    }
  }
}
