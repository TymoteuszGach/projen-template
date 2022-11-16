import * as fs from "fs-extra"; // eslint-disable-line
import * as path from "path"; // eslint-disable-line
import { Component, SampleDir } from "projen";
import { CdkMicroservice } from "./cdk-microservice";

export class SampleCode extends Component {
  private readonly cdkMicroservice: CdkMicroservice;

  constructor(project: CdkMicroservice) {
    super(project);
    this.cdkMicroservice = project;
  }

  public synthesize(): void {
    if (this.filesExist()) {
      return;
    }

    const projectType = toPascalCase(this.cdkMicroservice.projectName);
    const repoName = `tymoteuszgach/${this.cdkMicroservice.projectName}`;

    new SampleDir(this.cdkMicroservice, this.cdkMicroservice.srcdir, {
      files: {
        "main.ts": createAppTsContents(repoName),
      },
    });

    const libDir = path.join(this.cdkMicroservice.srcdir, "lib");
    new SampleDir(this.cdkMicroservice, libDir, {
      files: {
        [`${this.cdkMicroservice.projectName}-stack.ts`]: projectStackContents(projectType),
        "pipeline-stack.ts": createPipelineStackTsContents(),
        "pipeline-app-stage.ts": createPipelineAppStageTsContents(this.cdkMicroservice.projectName, projectType),
      },
    });
  }

  private filesExist(): boolean {
    return (
      fs.pathExistsSync(this.cdkMicroservice.srcdir) &&
      fs.readdirSync(this.cdkMicroservice.srcdir).filter((x) => x.endsWith(".ts")).length > 0
    );
  }
}

function createAppTsContents(repositoryName: string): string {
  return `#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { PipelineStack, PipelineStackProps } from "./lib/pipeline-stack";

const REPOSITORY_NAME = "${repositoryName}";

const app = new cdk.App();
const props: PipelineStackProps = {
    git: {
        repository: REPOSITORY_NAME,
    },
    pipelineAppStageProps: {},
};

new PipelineStack(app, "PipelineStack", props);

app.synth();
`;
}

function createPipelineStackTsContents(): string {
  return `import { Stack, StackProps } from "aws-cdk-lib";
import { CodePipeline, CodePipelineSource, ShellStep } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { PipelineAppStage, PipelineAppStageProps } from "./pipeline-app-stage";

const DEFAULT_MAIN_BRANCH_NAME = "main";

export interface GitProps {
    repository: string;
    branch?: string;
}

export interface PipelineStackProps extends StackProps {
    git: GitProps;
    pipelineAppStageProps: PipelineAppStageProps;
}

export class PipelineStack extends Stack {
    constructor(scope: Construct, id: string, props: PipelineStackProps) {
        super(scope, id, props);

        const branch = props.git.branch ?? DEFAULT_MAIN_BRANCH_NAME;

        const pipeline = new CodePipeline(this, "Pipeline", {
            synth: new ShellStep("Synth", {
                input: CodePipelineSource.gitHub(props.git.repository, branch),
                commands: ["npm run test", "npm run package"],
            }),
        });

        pipeline.addStage(new PipelineAppStage(this, "AppStage", props.pipelineAppStageProps));
    }
}
`;
}

function createPipelineAppStageTsContents(projectName: string, projectType: string): string {
  let projectTypeVariable = projectType[0].toLowerCase() + projectType.substring(1);
  return `import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ${projectType}Stack, ${projectType}StackProps } from "./${projectName}-stack";

export interface PipelineAppStageProps extends cdk.StackProps {
  ${projectTypeVariable}StackProps?: ${projectType}StackProps
}

export class PipelineAppStage extends cdk.Stage {
    constructor(scope: Construct, id: string, props: PipelineAppStageProps) {
        super(scope, id, props);

        new ${projectType}Stack(this, "${projectType}", props.${projectTypeVariable}StackProps);
    }
}
`;
}

function projectStackContents(projectType: string): string {
  return `import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface ${projectType}StackProps extends cdk.StackProps {}

export class ${projectType}Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ${projectType}StackProps) {
    super(scope, id, props);
  }
}`;
}

function toPascalCase(text: string): string {
  return text.replace(/(^\w|-\w)/g, clearAndUpper);
}

function clearAndUpper(text: string): string {
  return text.replace(/-/, "").toUpperCase();
}
