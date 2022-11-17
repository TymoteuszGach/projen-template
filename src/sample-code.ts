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

    new SampleDir(this.cdkMicroservice, this.cdkMicroservice.srcdir, {
      files: {
        "main.ts": createAppTsContents("TymoteuszGach", this.cdkMicroservice.projectName),
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

function createAppTsContents(repositoryOwner: string, repositoryName: string): string {
  return `#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { PipelineStack, PipelineStackProps } from "./lib/pipeline-stack";

const REPOSITORY_OWNER = "${repositoryOwner}";
const REPOSITORY_NAME = "${repositoryName}";

const app = new cdk.App();
const props: PipelineStackProps = {
  git: {
    owner: REPOSITORY_OWNER,
    repository: REPOSITORY_NAME,
    codeStarConnectionSSMParameterName: "/github-connection-arn",
  },
  pipelineAppStageProps: {},
};

new PipelineStack(app, "PipelineStack", props);

app.synth();
`;
}

function createPipelineStackTsContents(): string {
  return `import { Stack, StackProps } from "aws-cdk-lib";
import { BuildEnvironmentVariableType } from "aws-cdk-lib/aws-codebuild";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { CodeBuildStep, CodePipeline, CodePipelineSource } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { PipelineAppStage, PipelineAppStageProps } from "./pipeline-app-stage";

const DEFAULT_MAIN_BRANCH_NAME = "main";

export interface GitProps {
  codeStarConnectionSSMParameterName: string;
  owner: string;
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

    const connectionArn = ssm.StringParameter.fromStringParameterAttributes(this, "ConnectionParameter", {
      parameterName: props.git.codeStarConnectionSSMParameterName,
    }).stringValue;

    const repositoryName = \`\${props.git.owner}/\${props.git.repository}\`;
    const branch = props.git.branch ?? DEFAULT_MAIN_BRANCH_NAME;

    const pipeline = new CodePipeline(this, "Pipeline", {
      synth: new CodeBuildStep("Synth", {
        input: CodePipelineSource.connection(repositoryName, branch, {
          connectionArn: connectionArn,
        }),
        commands: [
          \`npm set //npm.pkg.github.com/:_authToken \\$GITHUB_TOKEN\`,
          "npm set @tymoteuszgach:registry=https://npm.pkg.github.com/",
          "npm ci",
          "npm run synth",
        ],
        buildEnvironment: {
          environmentVariables: {
            GITHUB_TOKEN: {
              type: BuildEnvironmentVariableType.PARAMETER_STORE,
              value: "/github-token",
            },
          },
        },
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
  ${projectTypeVariable}StackProps?: ${projectType}StackProps;
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
}
`;
}

function toPascalCase(text: string): string {
  return text.replace(/(^\w|-\w)/g, clearAndUpper);
}

function clearAndUpper(text: string): string {
  return text.replace(/-/, "").toUpperCase();
}
