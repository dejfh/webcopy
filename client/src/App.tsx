import React, { useMemo, useState } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Container from '@material-ui/core/Container';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Button, TextField } from '@material-ui/core';
import { State } from './api';
import QRCode from 'react-qr-code';
import { AppState } from './AppState';
import { useBehaviorSubject } from './hooks';

const useStyles = makeStyles((theme) => ({
  main: {
    marginTop: theme.spacing(8)
  },
  item: {
    margin: theme.spacing(2, 0, 0)
  },
  submit: {
    margin: theme.spacing(2, 0, 0),
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
      <Typography className={classes.item} variant="h4" component="h1">
        Websocket test
      </Typography>

      {
        !conn ? (
          <React.Fragment>
            <Button variant="contained" color="primary" onClick={() => doInit()}>init</Button>
            <TextField label="Token" variant="outlined" value={token} onChange={e => props.state.token.next(e.target.value)} />
            <Button variant="contained" color="primary" onClick={() => doJoin(token)}>join</Button>
          </React.Fragment>
        ) : null
      }
      {
        conn && connState < State.WAITING ? (
          <Typography variant="body1">
            Connecting...
          </Typography>
        ) : null
      }
      {
        conn && connState === State.WAITING ? (
          conn.isInitiator ? (
            <React.Fragment>
              <Typography variant="body1">
                Waiting for connection...
              </Typography>
              <QRCode value="joinUrl.toString()" />
              <Typography variant="body2">
                {joinUrl.toString()}
              </Typography>
            </React.Fragment>
          ) : (
            <Typography variant="body1">
              Connecting...
            </Typography>
          )
        ) : null
      }
      {
        conn && conn.didPair ? (
          <React.Fragment>
            <Typography className={classes.item} variant="h5" component="h2">
              Send something
            </Typography>
            <TextField className={classes.item} label="What to send" multiline variant="outlined" style={{ width: "100%" }}
              value={toSend} onChange={e => setToSend(e.target.value)} disabled={connState === State.CLOSED} />
            <Button className={classes.submit} variant="contained" color="primary"
              onClick={() => doSend()} disabled={connState === State.CLOSED}>Send</Button>

            <Typography className={classes.item} variant="h5" component="h2">
              You got something
            </Typography>
            <TextField className={classes.item} label="Response" multiline variant="outlined" style={{ width: "100%" }}
              value={response} InputProps={{ readOnly: true }} />
            <Button className={classes.submit} variant="text" color="default"
              onClick={() => responseToClipboard()}>copy</Button>
          </React.Fragment>
        ) : null
      }
      {
        conn && conn.state === State.CLOSED && !conn.didPair ? (
          <Typography className={classes.item} variant="h5" component="h2">
            Bad things happened.
          </Typography>
        ) : null
      }
    </Container>
  );
}

export default App;
