import React, { useMemo, useState } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Container from '@material-ui/core/Container';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Button, FormControl, IconButton, Input, InputAdornment, InputLabel, Paper, TextField } from '@material-ui/core';
import { State } from './api';
import QRCode from 'react-qr-code';
import { AppState } from './AppState';
import { useBehaviorSubject } from './hooks';
import clsx from 'clsx';
import { Visibility, VisibilityOff, FileCopy } from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  main: {
    marginTop: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(1)
  },
  margin: {
    margin: theme.spacing(1)
  },
  fullWidth: {
    width: "100%",
    margin: theme.spacing(1),
    padding: theme.spacing(0, 2, 0, 0)
  },
}));

function App(props: { state: AppState }) {
  const classes = useStyles();

  const [toSend, setToSend] = useState('')

  const conn = useBehaviorSubject(props.state.conn)
  const response = useBehaviorSubject(props.state.response)
  const token = useBehaviorSubject(props.state.token)
  const connState = useBehaviorSubject(props.state.connState)

  const doInit = () => {
    props.state.connect()
  }

  const doJoin = (token: string) => {
    props.state.connect(token)
  }

  const doSend = () => {
    conn?.sendText(toSend)
    setToSend('')
  }

  const responseToClipboard = useMemo(() => () => {
    navigator.clipboard.writeText(response)
  }, [response])

  const joinUrl = new URL(window.location.href)
  joinUrl.hash = "#join=" + conn?.getToken()

  return (
    <Container component="main" className={classes.main} maxWidth="sm">
      <CssBaseline />
      <Typography className={classes.margin} variant="h5" component="h1">
        Webcopy
      </Typography>
      <Paper className={classes.paper}>
        {
          !conn ? (
            <React.Fragment>
              <Typography className={classes.margin} variant="h6" component="h2">
                Start new session
              </Typography>
              <Button className={classes.margin} variant="contained" color="primary" onClick={() => doInit()}>init</Button>
              <Typography className={classes.margin} variant="h6" component="h2">
                Join session with token
              </Typography>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <TextField className={clsx(classes.margin)} style={{ flexGrow: 1 }} label="Token" value={token} onChange={e => props.state.token.next(e.target.value)} />
                <Button className={classes.margin} style={{ flexGrow: 0 }} variant="contained" color="primary" onClick={() => doJoin(token)}>join</Button>
              </div>
            </React.Fragment>
          ) : null
        }
        {
          conn && connState < State.WAITING ? (
            <Typography className={classes.margin} variant="body1">
              Connecting...
            </Typography>
          ) : null
        }
        {
          conn && connState === State.WAITING ? (
            conn.isInitiator ? (
              <React.Fragment>
                <Typography className={classes.margin} variant="body1">
                  Waiting for connection...
                </Typography>
                <QRCode className={classes.margin} value="joinUrl.toString()" />
                <Typography className={classes.margin} variant="body2">
                  <a href={joinUrl.toString()} target="_blank">{joinUrl.toString()}</a>
                </Typography>
              </React.Fragment>
            ) : (
              <Typography className={classes.margin} variant="body1">
                Connecting...
              </Typography>
            )
          ) : null
        }
        {
          conn && conn.didPair ? (
            <React.Fragment>
              {
                response !== '' ? (
                  <React.Fragment>
                    <Typography className={classes.margin} variant="h6" component="h2">
                      You got something
                    </Typography>
                    <TextField className={classes.fullWidth} label="Response" multiline
                      value={response}
                      InputProps={{
                        readOnly: true,
                        endAdornment: <InputAdornment position="end">
                          <IconButton aria-label="toggle password visibility" edge="end"
                            onClick={() => responseToClipboard()}>
                            <FileCopy />
                          </IconButton>
                        </InputAdornment>
                      }} />
                  </React.Fragment>
                ) : null
              }
              {
                connState === State.PAIRED ? (
                  <React.Fragment>
                    <Typography className={classes.margin} variant="h6" component="h2">
                      Send something
                    </Typography>
                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                      <TextField className={classes.margin} label="What to send" multiline style={{ flexGrow: 1 }}
                        value={toSend} onChange={e => setToSend(e.target.value)} />
                      <Button className={classes.margin} variant="contained" color="primary" style={{ flexGrow: 0 }}
                        onClick={() => doSend()}>Send</Button>
                    </div>
                  </React.Fragment>
                ) : (
                  <Typography className={classes.margin} variant="body1">
                    Connection lost
                  </Typography>
                )
              }
            </React.Fragment>
          ) : null
        }
        {
          conn && conn.state === State.CLOSED && !conn.didPair ? (
            <Typography className={classes.margin} variant="h6" component="h2">
              Bad things happened.
            </Typography>
          ) : null
        }
      </Paper>
    </Container>
  );
}

export default App;
