import type { APIGatewayProxyEvent, Context } from "aws-lambda";
import serverlessExpress from "@vendia/serverless-express";
import { createApp } from "./app";

let cachedHandler: ReturnType<typeof serverlessExpress> | null = null;

export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
  if (!cachedHandler) {
    const app = await createApp();
    cachedHandler = serverlessExpress({ app });
  }

  return cachedHandler(event, context);
};
