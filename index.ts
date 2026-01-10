import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

// 東京リージョンにストレージバケットを作成
const bucket = new gcp.storage.Bucket("my-gemini-managed-bucket", {
    location: "ASIA-NORTHEAST1",
    forceDestroy: true,
});

// デプロイ後に確認するための出力
export const bucketName = bucket.name;
export const bucketUrl = bucket.url;
