import {
  Button,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
} from "@material-ui/core";
import Container from "@material-ui/core/Container";
import CssBaseline from "@material-ui/core/CssBaseline";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import { FileCopy } from "@material-ui/icons";
import clsx from "clsx";
import React, { useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { AppReadyState, AppState } from "./AppState";
import { useBehaviorSubject } from "./hooks";

const useStyles = makeStyles((theme) => ({
  main: {
    marginTop: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(1),
  },
  margin: {
    margin: theme.spacing(1),
  },
  fullWidth: {
    width: "100%",
    margin: theme.spacing(1),
    padding: theme.spacing(0, 2, 0, 0),
  },
}));

function App(props: { state: AppState }) {
  const classes = useStyles();

  const [toSend, setToSend] = useState("");
  const [coupleName, setCoupleName] = useState("");

  const response = useBehaviorSubject(props.state.response);
  const token = useBehaviorSubject(props.state.token);
  const connState = useBehaviorSubject(props.state.connState);
  const coupleOffer = useBehaviorSubject(props.state.coupleOffer);

  const doInit = () => {
    props.state.init();
  };

  const doJoin = (token: string) => {
    props.state.join(token);
  };

  const doSend = () => {
    props.state.sendText(toSend);
    setToSend("");
  };

  const responseToClipboard = useMemo(
    () => () => {
      navigator.clipboard.writeText(response);
    },
    [response]
  );

  const joinUrl = new URL(window.location.href);
  joinUrl.hash = "#join=" + token;

  return (
    <Container component="main" className={classes.main} maxWidth="sm">
      <CssBaseline />
      <Typography className={classes.margin} variant="h5" component="h1">
        Webcopy
      </Typography>
      <Paper className={classes.paper}>
        {connState === AppReadyState.NONE ? (
          <React.Fragment>
            <Typography className={classes.margin} variant="h6" component="h2">
              Start new session
            </Typography>
            <Button
              className={classes.margin}
              variant="contained"
              color="primary"
              onClick={() => doInit()}
            >
              init
            </Button>
            <Typography className={classes.margin} variant="h6" component="h2">
              Join session with token
            </Typography>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <TextField
                className={clsx(classes.margin)}
                style={{ flexGrow: 1 }}
                label="Token"
                value={token}
                onChange={(e) => props.state.token.next(e.target.value)}
              />
              <Button
                className={classes.margin}
                style={{ flexGrow: 0 }}
                variant="contained"
                color="primary"
                onClick={() => doJoin(token)}
              >
                join
              </Button>
            </div>
          </React.Fragment>
        ) : null}
        {connState > AppReadyState.NONE && connState < AppReadyState.WAITING ? (
          <Typography className={classes.margin} variant="body1">
            Connecting...
          </Typography>
        ) : null}
        {connState === AppReadyState.WAITING ? (
          token !== "" ? (
            <React.Fragment>
              <Typography className={classes.margin} variant="body1">
                Waiting for connection...
              </Typography>
              <QRCode className={classes.margin} value={joinUrl.toString()} />
              <Typography className={classes.margin} variant="body2">
                <a href={joinUrl.toString()} target="_blank" rel="noreferrer">
                  {joinUrl.toString()}
                </a>
              </Typography>
              {props.state.coupleStorage.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "end" }}>
                  <Button
                    style={{ flexGrow: 0 }}
                    onClick={() => {
                      props.state.invite(item.data, token);
                    }}
                  >
                    {item.name}
                  </Button>
                </div>
              ))}
            </React.Fragment>
          ) : (
            <Typography className={classes.margin} variant="body1">
              Connecting...
            </Typography>
          )
        ) : null}
        {connState >= AppReadyState.PAIRED ? (
          <React.Fragment>
            {response !== "" ? (
              <React.Fragment>
                <Typography
                  className={classes.margin}
                  variant="h6"
                  component="h2"
                >
                  You got something
                </Typography>
                <TextField
                  className={classes.fullWidth}
                  label="Response"
                  multiline
                  value={response}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          edge="end"
                          onClick={() => responseToClipboard()}
                        >
                          <FileCopy />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </React.Fragment>
            ) : null}
            {coupleOffer ? (
              <React.Fragment>
                <Typography
                  className={classes.margin}
                  variant="h6"
                  component="h2"
                >
                  You received a couple offer
                </Typography>
                <div style={{ display: "flex", alignItems: "end" }}>
                  <TextField
                    className={classes.margin}
                    label="Name"
                    multiline
                    style={{ flexGrow: 1 }}
                    value={coupleName}
                    onChange={(e) => setCoupleName(e.target.value)}
                  />
                  <Button
                    className={classes.margin}
                    variant="contained"
                    color="primary"
                    style={{ flexGrow: 0 }}
                    onClick={() => props.state.storeCouple(coupleName)}
                  >
                    Store
                  </Button>
                </div>
              </React.Fragment>
            ) : null}
            {connState === AppReadyState.PAIRED ? (
              <React.Fragment>
                <Typography
                  className={classes.margin}
                  variant="h6"
                  component="h2"
                >
                  Send something
                </Typography>
                <div style={{ display: "flex", alignItems: "end" }}>
                  <TextField
                    className={classes.margin}
                    label="What to send"
                    multiline
                    style={{ flexGrow: 1 }}
                    value={toSend}
                    onChange={(e) => setToSend(e.target.value)}
                  />
                  <Button
                    className={classes.margin}
                    variant="contained"
                    color="primary"
                    style={{ flexGrow: 0 }}
                    onClick={() => doSend()}
                  >
                    Send
                  </Button>
                </div>
                <div style={{ display: "flex", justifyContent: "end" }}>
                  <Button
                    className={classes.margin}
                    variant="contained"
                    color="primary"
                    style={{ flexGrow: 0 }}
                    onClick={() => props.state.sendCouple()}
                  >
                    Couple
                  </Button>
                </div>
              </React.Fragment>
            ) : null}
            {connState === AppReadyState.CLOSED ? (
              <Typography className={classes.margin} variant="body1">
                Connection lost
              </Typography>
            ) : null}{" "}
            {connState === AppReadyState.ERROR ? (
              <Typography className={classes.margin} variant="body1">
                Bad things happened
              </Typography>
            ) : null}
          </React.Fragment>
        ) : null}
      </Paper>
    </Container>
  );
}

export default App;
