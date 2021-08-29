FROM golang:1.17-alpine AS go
COPY ./server/go.mod ./server/go.sum /app/
WORKDIR /app
RUN go mod download
COPY ./server /app
RUN go build .

FROM alpine
COPY --from=go /app/wsrelay /app/
COPY /client/build /app/static
WORKDIR /app
CMD [ "./wsrelay" ]
