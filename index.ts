import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Create an S3 bucket for website hosting
const siteBucket = new aws.s3.Bucket("siteBucket", {
    website: {
        indexDocument: "index.html",
    },
});

// Upload an index.html file
new aws.s3.BucketObject("index", {
    bucket: siteBucket,
    source: new pulumi.asset.FileAsset("index.html"),
    contentType: "text/html",
});

// CloudFront Origin Access Identity (OAI) to restrict direct access to S3
const originAccessIdentity = new aws.cloudfront.OriginAccessIdentity("oai");

// CloudFront Distribution
const cdn = new aws.cloudfront.Distribution("cdn", {
    origins: [
        {
            domainName: siteBucket.websiteEndpoint.apply(ep => ep.replace("http://", "")), // Remove "http://"
            originId: "s3-origin",
            s3OriginConfig: { originAccessIdentity: originAccessIdentity.cloudfrontAccessIdentityPath },
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
        cloudfrontDefaultCertificate: true, // Use the default CloudFront SSL certificate
    },
});

// Export useful outputs
export const bucketName = siteBucket.id;
export const cdnUrl = cdn.domainName;
