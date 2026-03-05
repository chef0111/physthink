const model = process.env.K2THINK_MODEL_ID as string;

export type K2ThinkChatModel = typeof model | (string & {});
