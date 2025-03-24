import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Create an S3 bucket to host the static website
const siteBucket = new aws.s3.Bucket("myBucket");

// ✅ Upload index.html to the bucket
const indexObject = new aws.s3.BucketObject("index", {
    bucket: siteBucket.bucket,  // Don't hardcode the bucket name
    source: new pulumi.asset.FileAsset("index.html"),
    contentType: "text/html",
});

// ✅ Create a CloudFront Origin Access Identity (OAI)
const originAccessIdentity = new aws.cloudfront.OriginAccessIdentity("oai");

// ✅ Create a CloudFront distribution for the S3 bucket
const cdn = new aws.cloudfront.Distribution("cdn", {
    origins: [
        {
            domainName: siteBucket.bucketRegionalDomainName,
            originId: "s3-origin",
            s3OriginConfig: { 
                originAccessIdentity: `origin-access-identity/cloudfront/${originAccessIdentity.id}` // ✅ Corrected OAI reference
            },
        },
    ],
    enabled: true,
    defaultRootObject: "index.html",
    defaultCacheBehavior: {
        viewerProtocolPolicy: "redirect-to-https",
        targetOriginId: "s3-origin",
        allowedMethods: ["GET", "HEAD"],
        cachedMethods: ["GET", "HEAD"],
        forwardedValues: {
            queryString: false,
            cookies: { forward: "none" },
        },
    },
    restrictions: {
        geoRestriction: {
            restrictionType: "none", // No geo-restrictions
        },
    },
    viewerCertificate: {
        cloudfrontDefaultCertificate: true, // Use CloudFront's default SSL certificate
    },
});

// ✅ Export bucket name and CloudFront URL
export const bucketName = siteBucket.id;
export const cdnUrl = cdn.domainName;
