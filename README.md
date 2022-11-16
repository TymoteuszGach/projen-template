# projen-template

This repository defines a custom template used to quickly orchestrate CDK-based microservices with projen.

To create a new microservice from the template:
1. create an empty directory:
```shell
mkdir my-service && cd my-service
```
2. run the following command:
```shell
npx projen new --from @tymoteuszgach/projen-template
```