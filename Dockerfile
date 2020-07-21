FROM node:12-alpine AS build

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY package.json /app
COPY yarn.lock /app
RUN yarn

# Bundle app source
COPY . /app/
RUN yarn build && yarn --production

# Copy build into new smaller docker container
FROM node:10-alpine
COPY --from=build /app /app
WORKDIR /app
EXPOSE 3000
CMD [ "yarn", "start" ]
