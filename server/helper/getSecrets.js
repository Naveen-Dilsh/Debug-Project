const AWS = require("aws-sdk");
require("aws-sdk/lib/maintenance_mode_message").suppress = true;

async function getSecrets() {
  try {
    if (process.env.NODE_ENV === "production") {
      console.log("Node server start | MODE=production");

      require("dotenv").config();

      // Configure AWS SDK
      AWS.config.update({
        region: "ap-southeast-1",
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });

      // Create a Secrets Manager client
      const secretsManager = new AWS.SecretsManager();

      const secretId = process.env.AWS_SECRET_ARN;

      const data = await secretsManager
        .getSecretValue({ SecretId: secretId })
        .promise();

      if (data.SecretString) {
        const secretValues = JSON.parse(data.SecretString);

        // Assign each key-value to process.env
        Object.keys(secretValues).forEach((key) => {
          process.env[key] = secretValues[key];
        });
        return true;
      } else {
        return false;
      }
    } else {
      console.log("Node server start | MODE=development");
      require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
      return true;
    }
  } catch (error) {
    console.error("Error fetching secret:", error);
  }
}

module.exports = getSecrets;
