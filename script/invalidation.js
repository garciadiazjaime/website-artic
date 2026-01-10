import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
import { loggerInfo } from "./support.js";
import "dotenv/config";

const cloudFrontClient = new CloudFrontClient({ region: "us-east-1" });
const DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID;

async function main() {
  loggerInfo("Creating CloudFront invalidation...");

  const command = new CreateInvalidationCommand({
    DistributionId: DISTRIBUTION_ID,
    InvalidationBatch: {
      CallerReference: `invalidation-${Date.now()}`,
      Paths: {
        Quantity: 1,
        Items: ["/public/art-quiz/*"],
      },
    },
  });

  const response = await cloudFrontClient.send(command);
  loggerInfo(`Invalidation created: ${response.Invalidation.Id}`);
}

main().then(() => {
  loggerInfo("done");
});
