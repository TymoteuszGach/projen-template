import { cdk, javascript } from "projen";

const project = new cdk.JsiiProject({
  author: "Tymoteusz Gach",
  authorAddress: "tymoteusz.gach@merapar.com",
  defaultReleaseBranch: "main",
  name: "@tyga/projen-template",
  packageManager: javascript.NodePackageManager.NPM,
  projenrcTs: true,
  repositoryUrl: "ssh://git@github.com/TymoteuszGach/projen-template.git",
  gitignore: [".idea"],
  prettier: true,
  prettierOptions: {
    settings: {
      printWidth: 120,
    },
  },
  sampleCode: false,
  npmDistTag: "latest",
  npmRegistryUrl: "https://npm.pkg.github.com",
});

project.synth();
