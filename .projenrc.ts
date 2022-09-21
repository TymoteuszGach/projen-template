import { cdk, javascript } from "projen";

const project = new cdk.JsiiProject({
  author: "Tymoteusz Gach",
  authorAddress: "tymoteusz.gach@merapar.com",
  defaultReleaseBranch: "main",
  name: "projen-template",
  packageManager: javascript.NodePackageManager.NPM,
  projenrcTs: true,
  repositoryUrl: "ssh://git@github.com/TymoteuszGach/projen-template.git",
  gitignore: [".idea"],
  prettier: true,
  sampleCode: false,
});

project.synth();
