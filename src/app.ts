import { ApolloServer, gql } from "apollo-server-express";
import express, { Request, Response } from "express";
import { schema } from "./schema";
import { api } from "./routers";

const port = process.env.PORT || 3000;
const isPlaygroundActive = process.env.NODE_ENV !== "production";

const apolloServer = new ApolloServer({
    schema,
    playground: isPlaygroundActive
});

const app: any = express();
app.set("port", port);
app.use(express.json());
app.use(function(req:any, res:any, next:any) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(api);

apolloServer.applyMiddleware({ app, cors: true });

// Health check
app.get("/healthz", (req: Request, res: Response) => {
    res.send("ok");
});

export default app;
