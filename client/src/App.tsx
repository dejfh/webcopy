import { useMemo, useState } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Container from '@material-ui/core/Container';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Button, TextField } from '@material-ui/core';
import { connectMirror } from './api';
import QRCode from 'react-qr-code';

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

function App() {
  const classes = useStyles();

  const [response, setResponse] = useState('')
  const [toSend, setToSend] = useState('')

  const connection = useMemo(() => connectMirror(msg => setResponse(msg)), [])

  const doSend = useMemo(() => () => {
    connection.send(toSend)
    setToSend('')
  }, [connection, toSend]);

  const responseToClipboard = useMemo(() => () => {
    navigator.clipboard.writeText(response)
  }, [response])

  return (
    <Container component="main" className={classes.main} maxWidth="sm">
      <CssBaseline />
      <Typography className={classes.item} variant="h4" component="h1">
        Websocket test
      </Typography>

      <QRCode value="http://google.com" />

      <Typography className={classes.item} variant="h5" component="h2">
        Send something
      </Typography>
      <TextField className={classes.item} label="What to send" multiline variant="outlined" style={{ width: "100%" }}
        value={toSend} onChange={e => setToSend(e.target.value)} />
      <Button className={classes.submit} variant="contained" color="primary"
        onClick={() => doSend()}>Send</Button>

      <Typography className={classes.item} variant="h5" component="h2">
        You got something
      </Typography>
      <TextField className={classes.item} label="Response" multiline variant="outlined" style={{ width: "100%" }}
        value={response} InputProps={{ readOnly: true }} />
      <Button className={classes.submit} variant="text" color="default"
        onClick={() => responseToClipboard()}>copy</Button>
    </Container>
  );
}

export default App;
