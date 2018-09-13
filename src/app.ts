import { ApolloServer, gql } from "apollo-server-express";
import express, { Request, Response } from "express";
import { schema } from "./schemas";

const port = process.env.PORT || 3000;
const isPlaygroundActive = process.env.NODE_ENV !== "production";

const apolloServer = new ApolloServer({
    schema,
    playground: isPlaygroundActive
});

const app = express();
app.set("port", port);

apolloServer.applyMiddleware({ app, cors: true });

// Health check
app.get("/healthz", (req: Request, res: Response) => {
    res.send("ok");
});

export default app;
