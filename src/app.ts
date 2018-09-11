import { ApolloServer, gql } from 'apollo-server-express';
import express from 'express';
import { schema } from './schemas';

const port = process.env.PORT || 3000;
const isPlaygroundActive = process.env.NODE_ENV !== 'production';

const apolloServer = new ApolloServer({ 
    schema,
    playground: isPlaygroundActive
});

const app = express();
app.set("port", port);
apolloServer.applyMiddleware({ app, cors: true });

export default app;