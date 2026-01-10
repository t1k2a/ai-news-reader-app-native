import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as command from "@pulumi/command";

// GCPプロジェクト情報を取得
const gcpConfig = new pulumi.Config("gcp");
const project = gcpConfig.require("project");
const region = "asia-northeast1"; // 東京リージョン

// Artifact Registry リポジトリを作成
const registry = new gcp.artifactregistry.Repository("app-registry", {
    location: region,
    repositoryId: "ai-news-reader",
    format: "DOCKER",
    description: "AI News Reader アプリケーションのDockerイメージ",
});

// イメージ名を構築
const imageName = pulumi.interpolate`${region}-docker.pkg.dev/${project}/${registry.repositoryId}/app:latest`;

// Cloud Build を使ってイメージをビルド＆プッシュ
const buildImage = new command.local.Command("build-and-push", {
    create: pulumi.interpolate`gcloud builds submit --project ${project} --tag ${imageName} .`,
    dir: "..",
}, { dependsOn: [registry] });

// Cloud Run サービスを作成
const service = new gcp.cloudrunv2.Service("ai-news-reader-service", {
    name: "ai-news-reader",
    location: region,
    ingress: "INGRESS_TRAFFIC_ALL",
    template: {
        containers: [{
            image: imageName,
            ports: {
                containerPort: 8080,
            },
            resources: {
                limits: {
                    memory: "1Gi",
                    cpu: "1",
                },
            },
        }],
        scaling: {
            minInstanceCount: 0,
            maxInstanceCount: 3,
        },
    },
}, { dependsOn: [buildImage] });

// Cloud Run サービスを公開（認証なしでアクセス可能に）
const iamBinding = new gcp.cloudrunv2.ServiceIamBinding("public-access", {
    name: service.name,
    location: region,
    role: "roles/run.invoker",
    members: ["allUsers"],
});

// 出力
export const serviceUrl = service.uri;
export const serviceName = service.name;
export const registryUrl = pulumi.interpolate`${region}-docker.pkg.dev/${project}/${registry.repositoryId}`;
