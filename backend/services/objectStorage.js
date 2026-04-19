const Minio = require("minio");

const endPoint = process.env.MINIO_ENDPOINT;
const port = Number(process.env.MINIO_PORT || 9000);
const useSSL = process.env.MINIO_USE_SSL === "true";
const accessKey = process.env.MINIO_ACCESS_KEY;
const secretKey = process.env.MINIO_SECRET_KEY;
const bucketName = process.env.MINIO_BUCKET || "movie-images";

let client = null;

function isConfigured() {
    return Boolean(endPoint && accessKey && secretKey);
}

function getClient() {
    if(!isConfigured()) {
        throw new Error("Configuration MinIO manquante.");
    }

    if (!client) {
        client = new Minio.Client({
            endPoint,
            port,
            useSSL,
            accessKey,
            secretKey,
        });
    }

    return client;
}

async function ensureBucket() {
    const storage = getClient();
    const exists = await storage.bucketExists(bucketName);

    if(!exists) {
        await storage.makeBucket(bucketName);
    }

    await storage.setBucketPolicy(
        bucketName,
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Action: ["s3:GetObject"],
                    Resource: [`arn:aws:s3:::${bucketName}/*`],
                },
            ],
        })
    );
}

async function uploadBuffer({ objectName, buffer, mimeType }) {
    const storage = getClient();

    await ensureBucket();

    await storage.putObject(bucketName, objectName, buffer, buffer.length, {
        "Content-Type": mimeType,
    });

    return `/${bucketName}/${objectName}`;
}

module.exports = {
    bucketName,
    ensureBucket,
    isConfigured,
    uploadBuffer,
};