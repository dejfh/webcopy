FROM node:16-alpine AS yarn
COPY ./client/package.json ./client/yarn.lock /app/
WORKDIR /app
RUN yarn install
COPY ./client /app
RUN yarn run build

FROM golang:1.17-alpine AS go
COPY ./server /app
WORKDIR /app
RUN go build .

FROM alpine
COPY --from=go /app/wsrelay /app/
COPY --from=yarn /app/build /app/static
WORKDIR /app
CMD [ "./wsrelay" ]
